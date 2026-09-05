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

// @desc    جلب الايرادات مفلترة بالشهر/السنة
// @route   GET ...?month=9&year=2026
// @note    من غير params بيرجع الشهر الحالي بس، و all=true بترجع كل السجلات
export const getAllRevenues = asyncHandler(async (req, res, next) => {
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

    // أول وآخر لحظة في الشهر المطلوب بتوقيت UTC
    // (التواريخ متخزنة UTC، فلازم الحدود تبقى UTC مهما كان توقيت السيرفر)
    filter.revenuesDate = {
      $gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
      $lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }

  const records = await RevenuesModel.find(filter).sort({ revenuesDate: -1 });

  // إجمالي الفترة المعروضة
  const periodAmount = records.reduce((sum, record) => sum + record.amount, 0);

  // إجمالي كل السجلات (كل الشهور) - بيتحسب في الداتا بيز من غير ما نجيب المستندات
  const grandTotalResult = await RevenuesModel.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalAmount = grandTotalResult[0]?.total || 0;

  // إجمالي الشهر الحالي مهما كان الشهر المعروض
  const currentMonthResult = await RevenuesModel.aggregate([
    {
      $match: {
        revenuesDate: {
          $gte: new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0),
          ),
          $lte: new Date(
            Date.UTC(
              today.getUTCFullYear(),
              today.getUTCMonth() + 1,
              0,
              23,
              59,
              59,
              999,
            ),
          ),
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const monthlyAmount = currentMonthResult[0]?.total || 0;

  res.status(200).json({
    success: true,
    results: records.length,
    totalAmount,
    monthlyAmount,
    periodAmount,
    month,
    year,
    isAllMonths: showAll,
    isCurrentMonth:
      !showAll &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear(),
    data: records,
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
