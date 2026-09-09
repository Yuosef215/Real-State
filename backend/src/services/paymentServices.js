import ApiError from "../utils/apiError.js";
import asyncHandler from "express-async-handler";
import PaymentModel from "../models/payment.js";
import ContractModel from "../models/contract.js";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// بيرجع المدفوع في كل شهر لعقد معين على شكل { "2026-8": 1500, ... }
function groupPaidByPeriod(payments) {
  const paidByPeriod = {};

  payments.forEach((payment) => {
    const key = `${payment.year}-${payment.month}`;
    paidByPeriod[key] = (paidByPeriod[key] || 0) + payment.amountPaid;
  });

  return paidByPeriod;
}

export const createPayment = asyncHandler(async (req, res, next) => {
  const { contract, amountPaid } = req.body;

  if (!contract || !amountPaid) {
    return next(new ApiError("يجب إدخال جميع بيانات الدفعة", 400));
  }

  // تاريخ الدفع دايماً هو النهاردة، لكن الشهر المدفوع عنه ممكن يكون شهر قديم
  // (سداد متأخرات). لو مش مبعوت بنستخدم الشهر الحالي زي ما كان بالظبط.
  const paymentDate = new Date();
  let month = paymentDate.getMonth() + 1;
  let year = paymentDate.getFullYear();

  const wantsSpecificPeriod =
    req.body.month !== undefined && req.body.year !== undefined;

  if (wantsSpecificPeriod) {
    month = Number(req.body.month);
    year = Number(req.body.year);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return next(new ApiError("الشهر يجب أن يكون رقم بين 1 و 12", 400));
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return next(new ApiError("السنة غير صحيحة", 400));
    }

    const currentMonth = paymentDate.getMonth() + 1;
    const currentYear = paymentDate.getFullYear();

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return next(new ApiError("لا يمكن تسجيل دفعة عن شهر لم يأت بعد", 400));
    }
  }

  const contractExists = await ContractModel.findById(contract);

  if (!contractExists) {
    return next(new ApiError("العقد غير موجود", 404));
  }

  if (contractExists.status !== "نشط") {
    return next(new ApiError("لا يمكن إضافة دفعة لعقد منتهي", 400));
  }

  // الشهر المدفوع عنه لازم يكون بعد بداية العقد
  if (wantsSpecificPeriod) {
    const start = new Date(contractExists.startDate);
    const startMonth = start.getMonth() + 1;
    const startYear = start.getFullYear();

    if (year < startYear || (year === startYear && month < startMonth)) {
      return next(
        new ApiError(
          `العقد بدأ في ${ARABIC_MONTHS[startMonth - 1]} ${startYear}، لا يمكن تسجيل دفعة قبله`,
          400
        )
      );
    }
  }

  const payments = await PaymentModel.find({
  contract,
  month,
  year,
  paymentType: "إيجار",
});

const paidAmount = payments.reduce(
  (sum, payment) => sum + payment.amountPaid,
  0
);

const remainingAmount = contractExists.monthlyRent - paidAmount;

const periodLabel = `${ARABIC_MONTHS[month - 1]} ${year}`;

if (remainingAmount <= 0) {
  return next(
    new ApiError(`تم سداد إيجار ${periodLabel} بالكامل`, 400)
  );
}

if (amountPaid > remainingAmount) {
  return next(
    new ApiError(
      `المبلغ أكبر من المتبقي على ${periodLabel} (${remainingAmount} جنيه)`,
      400
    )
  );
}

  if (amountPaid <= 0) {
    return next(new ApiError("المبلغ المدفوع يجب أن يكون أكبر من صفر", 400));
  }

  const newPayment = await PaymentModel.create({
    contract,
    amountPaid,
    paymentDate,
    month,
    year,
  });

  res.status(201).json({
    success: true,
    message: "تم إضافة الدفعة بنجاح",
    data: newPayment,
  });
});

// @desc    جلب الدفعات مفلترة بالشهر/السنة
// @route   GET /api/v1/payments/all_payments?month=9&year=2026
// @note    من غير params بيرجع دفعات الشهر الحالي بس، و all=true بترجع كل الدفعات
export const getAllPayments = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const showAll = req.query.all === "true";

  const filter = {};
  let month = null;
  let year = null;

  if (!showAll) {
    month = req.query.month ? Number(req.query.month) : today.getMonth() + 1;
    year = req.query.year ? Number(req.query.year) : today.getFullYear();

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return next(new ApiError("الشهر يجب أن يكون رقم بين 1 و 12", 400));
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return next(new ApiError("السنة غير صحيحة", 400));
    }

    filter.month = month;
    filter.year = year;
  }

  const payments = await PaymentModel.find(filter)
    .sort({ paymentDate: -1 })
    .populate({
      path: "contract",
      populate: [
        {
          path: "tenant",
          select: "name phone nationalId",
        },
        {
          path: "unit",
          select: "unitNumber floor",
          populate: {
            path: "property",
            select: "name",
          },
        },
      ],
    });

  // إجمالي المحصّل في الفترة المطلوبة
  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amountPaid,
    0,
  );

  res.status(200).json({
    success: true,
    total: payments.length,
    totalAmount,
    month,
    year,
    isAllMonths: showAll,
    isCurrentMonth:
      !showAll &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear(),
    message: "تم جلب الدفعات بنجاح",
    data: payments,
  });
});

export const getPaymentById = asyncHandler(async (req, res, next) => {
  const payment = await PaymentModel.findById(req.params.id).populate({
    path: "contract",
    populate: [
      {
        path: "tenant",
        select: "name phone nationalId",
      },
      {
        path: "unit",
        select: "unitNumber floor",
        populate: {
          path: "property",
          select: "name",
        },
      },
    ],
  });

  if (!payment) {
    return next(new ApiError("الدفعة غير موجودة", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم جلب الدفعة بنجاح",
    data: payment,
  });
});

export const updatePayment = asyncHandler(async (req, res, next) => {
  const { amountPaid } = req.body;

  if (amountPaid !== undefined && amountPaid <= 0) {
    return next(new ApiError("المبلغ المدفوع يجب أن يكون أكبر من صفر", 400));
  }

  const payment = await PaymentModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "contract",
    populate: [
      {
        path: "tenant",
        select: "name phone nationalId",
      },
      {
        path: "unit",
        select: "unitNumber floor",
        populate: {
          path: "property",
          select: "name",
        },
      },
    ],
  });

  if (!payment) {
    return next(new ApiError("الدفعة غير موجودة", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم تعديل الدفعة بنجاح",
    data: payment,
  });
});

export const deletePayment = asyncHandler(async (req, res, next) => {
  const payment = await PaymentModel.findByIdAndDelete(req.params.id);

  if (!payment) {
    return next(new ApiError("الدفعة غير موجودة", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم حذف الدفعة بنجاح",
    data: payment,
  });
});

export const getPaymentSummary = asyncHandler(async (req, res, next) => {
  const { contractId } = req.params;

  const contract = await ContractModel.findById(contractId)
    .populate("tenant", "name")
    .populate({
      path: "unit",
      select: "unitNumber property",
      populate: {
        path: "property",
        select: "name",
      },
    });

  if (!contract) {
    return next(new ApiError("العقد غير موجود", 404));
  }

  const currentDate = new Date();

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const payments = await PaymentModel.find({
    contract: contractId,
    month,
    year,
    paymentType: "إيجار",
  });

  const paidAmount = payments.reduce(
    (sum, payment) => sum + payment.amountPaid,
    0,
  );

  const remainingAmount = contract.monthlyRent - paidAmount;

  let status = "غير مدفوع";

  if (paidAmount > 0 && remainingAmount > 0) {
    status = "مدفوع جزئياً";
  }

  if (remainingAmount <= 0) {
    status = "مدفوع";
  }

  res.status(200).json({
    success: true,
    data: {
      contractId: contract._id,
      tenant: contract.tenant,
      property: contract.unit.property,
      unit: contract.unit,
      monthlyRent: contract.monthlyRent,
      paidAmount,
      remainingAmount,
      status,
      month,
      year,
    },
  });
});


// @desc    متأخرات عقد معين: الشهور السابقة اللي لسه عليها متبقي
// @route   GET /api/v1/payments/arrears/:contractId
// @note    بيبدأ الحساب من شهر أول دفعة اتسجلت (أو بداية العقد لو مفيش دفعات)
//          عشان منخترعش متأخرات عن شهور قبل ما النظام يشتغل أصلاً
export const getContractArrears = asyncHandler(async (req, res, next) => {
  const { contractId } = req.params;

  const contract = await ContractModel.findById(contractId)
    .populate("tenant", "name phone")
    .populate({
      path: "unit",
      select: "unitNumber",
      populate: { path: "property", select: "name" },
    });

  if (!contract) {
    return next(new ApiError("العقد غير موجود", 404));
  }

  const payments = await PaymentModel.find({
    contract: contractId,
    paymentType: "إيجار",
  });

  const paidByPeriod = groupPaidByPeriod(payments);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // نقطة البداية: بداية العقد، أو شهر أول دفعة لو كانت بعدها
  const start = new Date(contract.startDate);
  let month = start.getMonth() + 1;
  let year = start.getFullYear();

  if (payments.length > 0) {
    const sorted = [...payments].sort(
      (a, b) => a.year - b.year || a.month - b.month
    );
    const first = sorted[0];

    if (first.year > year || (first.year === year && first.month > month)) {
      month = first.month;
      year = first.year;
    }
  }

  // نهاية العقد: منحسبش شهور بعد ما العقد خلص
  const end = new Date(contract.endDate);
  const endMonth = end.getMonth() + 1;
  const endYear = end.getFullYear();

  const months = [];
  let totalArrears = 0;

  // بنلف شهر بشهر لحد الشهر اللي فات (الشهر الحالي بيتحسب لوحده)
  let guard = 0;
  while (
    (year < currentYear || (year === currentYear && month < currentMonth)) &&
    guard < 600
  ) {
    guard += 1;

    const afterContractEnd =
      year > endYear || (year === endYear && month > endMonth);

    if (afterContractEnd) break;

    const paid = paidByPeriod[`${year}-${month}`] || 0;
    const remaining = contract.monthlyRent - paid;

    if (remaining > 0) {
      months.push({
        month,
        year,
        monthName: ARABIC_MONTHS[month - 1],
        label: `${ARABIC_MONTHS[month - 1]} ${year}`,
        required: contract.monthlyRent,
        paid,
        remaining,
      });

      totalArrears += remaining;
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  // حالة الشهر الحالي
  const currentPaid = paidByPeriod[`${currentYear}-${currentMonth}`] || 0;
  const currentRemaining = contract.monthlyRent - currentPaid;

  let currentStatus = "غير مدفوع";
  if (currentRemaining <= 0) {
    currentStatus = "مدفوع";
  } else if (currentPaid > 0) {
    currentStatus = "مدفوع جزئياً";
  }

  res.status(200).json({
    success: true,
    data: {
      contractId: contract._id,
      tenant: contract.tenant,
      unit: contract.unit,
      monthlyRent: contract.monthlyRent,
      hasArrears: months.length > 0,
      monthsCount: months.length,
      totalArrears,
      months,
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        monthName: ARABIC_MONTHS[currentMonth - 1],
        label: `${ARABIC_MONTHS[currentMonth - 1]} ${currentYear}`,
        required: contract.monthlyRent,
        paid: currentPaid,
        remaining: currentRemaining > 0 ? currentRemaining : 0,
        status: currentStatus,
      },
      // إجمالي المستحق دلوقتي = متأخرات + متبقي الشهر الحالي
      totalDue: totalArrears + (currentRemaining > 0 ? currentRemaining : 0),
    },
  });
});
