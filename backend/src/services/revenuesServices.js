import asyncHandler from "express-async-handler";
import RevenuesModel from "../models/revenues.js";
import ApiError from "../utils/apiError.js";

// ================== Create revenues ==================

export const createRevenues = asyncHandler(async (req, res, next) => {
  const { title, amount, category, revenuesDate } = req.body;

  if (!title || !amount || !category) {
    return next(new ApiError("يجب إدخال جميع البيانات", 400));
  }

  const revenues = await RevenuesModel.create({
    title,
    amount,
    category,
    revenuesDate,
  });

  res.status(201).json({
    success: true,
    message: "تم إضافة الايراد بنجاح",
    data: revenues,
  });
});

// ================== Get All Expenses ==================

export const getAllRevenues = asyncHandler(async (req, res) => {
  const revenues = await RevenuesModel.find().sort({ revenuesDate: -1 });

  // إجمالي كل الايرادات
  const totalAmount = revenues.reduce(
    (sum, revenues) => sum + revenues.amount,
    0,
  );

  // الشهر الحالي
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // إجمالي مصروفات الشهر الحالي
  const monthlyAmount = revenues
    .filter((revenues) => {
      const revenuesDate = new Date(revenues.revenuesDate);

      return (
        revenuesDate.getMonth() === currentMonth &&
        revenuesDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, revenues) => sum + revenues.amount, 0);

  res.status(200).json({
    success: true,
    results: revenues.length,
    totalAmount,
    monthlyAmount,
    data: revenues,
  });
});

// ================== Get Expense By Id ==================

export const getRevenuesById = asyncHandler(async (req, res, next) => {
  const revenues = await RevenuesModel.findById(req.params.id);

  if (!revenues) {
    return next(new ApiError("الايراد غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    data: revenues,
  });
});

// ================== Update Expense ==================

export const updateRevenues = asyncHandler(async (req, res, next) => {
  const revenues = await RevenuesModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!revenues) {
    return next(new ApiError("الايراد غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم تعديل الايراد بنجاح",
    data: revenues,
  });
});

// ================== Delete Expense ==================

export const deleteRevenues = asyncHandler(async (req, res, next) => {
  const revenues = await RevenuesModel.findByIdAndDelete(req.params.id);

  if (!revenues) {
    return next(new ApiError("الايراد غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم حذف الايراد بنجاح",
  });
});
