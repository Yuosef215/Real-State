import PropertyModel from '../models/property.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';
import UnitModel from '../models/unit.js';
import ContractModel from '../models/contract.js';
import PaymentModel from '../models/payment.js';





export const createProperty = asyncHandler(async (req, res) => {
    const newProperty = await PropertyModel.create(req.body);

    res.status(201).json({
        success: true,
        message: "تم إضافة العقار بنجاح",
        data: newProperty,
    });
});

export const getAllProperties = asyncHandler(async (req, res) => {
    const properties = await PropertyModel.find();

    const data = await Promise.all(
        properties.map(async (property) => {
            const totalUnits = await UnitModel.countDocuments({
                property: property._id,
            });

            return {
                ...property.toObject(),
                totalUnits,
            };
        })
    );

    res.status(200).json({
        success: true,
        total: data.length,
        message: "تم جلب جميع العقارات بنجاح",
        data,
    });
});

export const getPropertyById = asyncHandler(async (req, res, next) => {
    const property = await PropertyModel.findById(req.params.id);

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }
    res.status(200).json({
        success: true,
        message: "تم جلب العقار بنجاح",
        data: property
    });
});

export const updateProperty = asyncHandler(async (req, res, next) => {
    const property = await PropertyModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        message: "تم تحديث العقار بنجاح",
        data: property
    });
});

export const deleteProperty = asyncHandler(async (req, res, next) => {
    const property = await PropertyModel.findByIdAndDelete(req.params.id);

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        message: "تم حذف العقار بنجاح",
        data: property
    });
});

export const getPropertiesByOwner = asyncHandler(async (req, res, next) => {
    const { ownerId } = req.params;

    const properties = await PropertyModel.find({ owner: ownerId });

    res.status(200).json({
        success: true,
        total: properties.length,
        message: "تم جلب عقارات المالك بنجاح",
        data: properties
    });
});
// @desc    تفاصيل عقار معين: كل وحداته + حالة كل وحدة (متاحه/مستأجره) + حالة سداد شهر معين
// @route   GET /api/v1/properties/property-details/:id?month=9&year=2026
// @note    لو الشهر/السنة مش مبعوتين بيرجع الشهر الحالي
export const getPropertyDetails = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const property = await PropertyModel.findById(id);

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }

    // ====== تحديد الشهر/السنة المطلوبين ======
    const today = new Date();
    const month = req.query.month ? Number(req.query.month) : today.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : today.getFullYear();

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        return next(new ApiError("الشهر يجب أن يكون رقم بين 1 و 12", 400));
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return next(new ApiError("السنة غير صحيحة", 400));
    }

    const isCurrentMonth =
        month === today.getMonth() + 1 && year === today.getFullYear();

    // أول وآخر يوم في الشهر المطلوب
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // كل وحدات العقار مرتبة بالدور ثم رقم الوحدة
    const units = await UnitModel.find({ property: id }).sort({ floor: 1, unitNumber: 1 });

    const unitIds = units.map((unit) => unit._id);

    // العقود اللي تخص الشهر المطلوب:
    // - الشهر الحالي: العقود النشطة (عشان العرض يطابق حالة الوحدات دلوقتي)
    // - شهر قديم: أي عقد كانت مدته شاملة الشهر ده حتى لو انتهى بعد كده
    const contractsQuery = isCurrentMonth
        ? { unit: { $in: unitIds }, status: "نشط" }
        : {
              unit: { $in: unitIds },
              startDate: { $lte: monthEnd },
              endDate: { $gte: monthStart },
          };

    const contracts = await ContractModel.find(contractsQuery)
        .sort({ startDate: 1 })
        .populate({
            path: "tenant",
            select: "name phone nationalId",
        });

    // ربط كل وحدة بعقدها النشط
    const contractByUnit = {};
    contracts.forEach((contract) => {
        contractByUnit[contract.unit.toString()] = contract;
    });

    // دفعات الإيجار الخاصة بالشهر المطلوب فقط
    const payments = await PaymentModel.find({
        contract: { $in: contracts.map((contract) => contract._id) },
        month,
        year,
        paymentType: "إيجار",
    });

    // إجمالي المدفوع لكل عقد في الشهر الحالي
    const paidByContract = {};
    payments.forEach((payment) => {
        const key = payment.contract.toString();
        paidByContract[key] = (paidByContract[key] || 0) + payment.amountPaid;
    });

    let rentedUnits = 0;
    let availableUnits = 0;
    let paidUnits = 0;
    let partiallyPaidUnits = 0;
    let unpaidUnits = 0;
    let expectedMonthlyRent = 0;
    let collectedThisMonth = 0;

    const unitsData = units.map((unit) => {
        const contract = contractByUnit[unit._id.toString()];

        // وحدة من غير عقد نشط = متاحة، مفيش حالة سداد ليها
        if (!contract) {
            availableUnits += 1;

            return {
                _id: unit._id,
                unitNumber: unit.unitNumber,
                floor: unit.floor,
                status: "متاحه",
                contract: null,
                tenant: null,
                monthlyRent: 0,
                paidAmount: 0,
                remainingAmount: 0,
                paymentStatus: "لا يوجد عقد",
            };
        }

        rentedUnits += 1;

        const paidAmount = paidByContract[contract._id.toString()] || 0;
        const remainingAmount = contract.monthlyRent - paidAmount;

        let paymentStatus = "غير مدفوع";
        if (remainingAmount <= 0) {
            paymentStatus = "مدفوع";
            paidUnits += 1;
        } else if (paidAmount > 0) {
            paymentStatus = "مدفوع جزئياً";
            partiallyPaidUnits += 1;
        } else {
            unpaidUnits += 1;
        }

        expectedMonthlyRent += contract.monthlyRent;
        collectedThisMonth += paidAmount;

        return {
            _id: unit._id,
            unitNumber: unit.unitNumber,
            floor: unit.floor,
            status: "مستأجره",
            contract: {
                _id: contract._id,
                monthlyRent: contract.monthlyRent,
                securityDeposit: contract.securityDeposit,
                startDate: contract.startDate,
                endDate: contract.endDate,
            },
            tenant: contract.tenant,
            monthlyRent: contract.monthlyRent,
            paidAmount,
            remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
            paymentStatus,
        };
    });

    res.status(200).json({
        success: true,
        message: "تم جلب تفاصيل العقار بنجاح",
        data: {
            property,
            month,
            year,
            isCurrentMonth,
            summary: {
                totalUnits: units.length,
                availableUnits,
                rentedUnits,
                paidUnits,
                partiallyPaidUnits,
                unpaidUnits,
                expectedMonthlyRent,
                collectedThisMonth,
                remainingThisMonth:
                    expectedMonthlyRent - collectedThisMonth > 0
                        ? expectedMonthlyRent - collectedThisMonth
                        : 0,
            },
            units: unitsData,
        },
    });
});
