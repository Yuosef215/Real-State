import ApiError from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';
import TenantModel from '../models/tenant.js';
import UnitModel from '../models/unit.js';
import ContractModel from '../models/contract.js';






export const createContract = asyncHandler(async (req, res, next) => {
    const {
        tenant,
        unit,
        monthlyRent,
        startDate,
        securityDeposit,
        endDate
    } = req.body;

    // التحقق من البيانات
    if (!tenant || !unit || !monthlyRent || !startDate || !endDate) {
        return next(new ApiError("يجب إدخال جميع بيانات العقد", 400));
    }

    // التأكد من وجود المستأجر
    const tenantExists = await TenantModel.findById(tenant);

    if (!tenantExists) {
        return next(new ApiError("المستأجر غير موجود", 404));
    }

    // التأكد من وجود الوحدة
    const unitExists = await UnitModel.findById(unit);

    if (!unitExists) {
        return next(new ApiError("الوحدة غير موجودة", 404));
    }

    // التأكد أن الوحدة غير مؤجرة
    const activeContract = await ContractModel.findOne({
        unit,
        status: "نشط"
    });

    if (activeContract) {
        return next(new ApiError("الوحدة مؤجرة بالفعل", 400));
    }

    // التحقق من التاريخ
    if (new Date(endDate) <= new Date(startDate)) {
        return next(
            new ApiError("تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية", 400)
        );
    }

    // إنشاء العقد
    const contract = await ContractModel.create({
        tenant,
        unit,
        monthlyRent,
        startDate,
        securityDeposit,
        endDate
    });

    // تحديث حالة الوحدة
    await UnitModel.findByIdAndUpdate(unit, {
        status: "مستأجره"
    });

    res.status(201).json({
        success: true,
        message: "تم إنشاء العقد بنجاح",
        data: contract
    });
});


export const getAllContracts = asyncHandler(async (req, res) => {
    const contracts = await ContractModel.find()
        .populate({
            path: "tenant",
            select: "name phone nationalId"
        })
        .populate({
            path: "unit",
            select: "unitNumber floor status",
            populate: {
                path: "property",
                select: "name address"
            }
        });

    res.status(200).json({
        success: true,
        results: contracts.length,
        data: contracts
    });
});


export const getContractById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const contract = await ContractModel.findById(id)
        .populate({
            path: "tenant",
            select: "name phone nationalId"
        })
        .populate({
            path: "unit",
            select: "unitNumber floor status",
            populate: {
                path: "property",
                select: "name address"
            }
        });

    if (!contract) {
        return next(new ApiError("العقد غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        data: contract
    });
});

export const updateContract = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const {
        tenant,
        unit,
        monthlyRent,
        startDate,
        securityDeposit,
        endDate,
        status
    } = req.body;

    const contract = await ContractModel.findById(id);

    if (!contract) {
        return next(new ApiError("العقد غير موجود", 404));
    }

    // التأكد من وجود المستأجر
    if (tenant) {
        const tenantExists = await TenantModel.findById(tenant);
        if (!tenantExists) {
            return next(new ApiError("المستأجر غير موجود", 404));
        }
    }

    // التأكد من وجود الوحدة
    if (unit) {
        const unitExists = await UnitModel.findById(unit);
        if (!unitExists) {
            return next(new ApiError("الوحدة غير موجودة", 404));
        }
    }

    // التأكد أن الوحدة غير مؤجرة إذا تم تغيير الوحدة
    if (unit && unit.toString() !== contract.unit.toString()) {
        const activeContract = await ContractModel.findOne({
            unit,
            status: "نشط"
        });
        if (activeContract) {
            return next(new ApiError("الوحدة مؤجرة بالفعل", 400));
        }
    }

    // تحديث العقد
    const updatedContract = await ContractModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: updatedContract
    });
});

export const deleteContract = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const contract = await ContractModel.findById(id);

    if (!contract) {
        return next(new ApiError("العقد غير موجود", 404));
    }   

    await ContractModel.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "العقد تم حذفه بنجاح"
    });
});
