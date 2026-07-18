import ApiError from "../utils/apiError.js";
import asyncHandler from "express-async-handler";
import PaymentModel from "../models/payment.js";
import ContractModel from "../models/contract.js";

export const createPayment = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const { contract, amountPaid } = req.body;

  if (!contract || !amountPaid) {
    return next(new ApiError("يجب إدخال جميع بيانات الدفعة", 400));
  }

  const paymentDate = new Date();
  const month = paymentDate.getMonth() + 1;
  const year = paymentDate.getFullYear();

  const contractExists = await ContractModel.findById(contract);

  if (!contractExists) {
    return next(new ApiError("العقد غير موجود", 404));
  }

  if (contractExists.status !== "نشط") {
    return next(new ApiError("لا يمكن إضافة دفعة لعقد منتهي", 400));
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

if (remainingAmount <= 0) {
  return next(new ApiError("تم سداد إيجار هذا الشهر بالكامل", 400));
}

if (amountPaid > remainingAmount) {
  return next(
    new ApiError(
      `المبلغ أكبر من المتبقي (${remainingAmount} جنيه)`,
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

export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await PaymentModel.find()
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

  res.status(200).json({
    success: true,
    total: payments.length,
    message: "تم جلب جميع الدفعات بنجاح",
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
