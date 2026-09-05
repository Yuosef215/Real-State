import asyncHandler from "express-async-handler";
import ExpenseModel from "../models/expense.js";
import ApiError from "../utils/apiError.js";

// ================== Create Expense ==================

export const createExpense = asyncHandler(async (req, res, next) => {
  const { title, amount, category, expenseDate } = req.body;

  if (!title || !amount || !category) {
    return next(new ApiError("يجب إدخال جميع البيانات", 400));
  }

  const expense = await ExpenseModel.create({
    title,
    amount,
    category,
    expenseDate,
  });

  res.status(201).json({
    success: true,
    message: "تم إضافة المصروف بنجاح",
    data: expense,
  });
});

// ================== Get All Expenses ==================

// @desc    جلب المصروفات مفلترة بالشهر/السنة
// @route   GET ...?month=9&year=2026
// @note    من غير params بيرجع الشهر الحالي بس، و all=true بترجع كل السجلات
export const getAllExpenses = asyncHandler(async (req, res, next) => {
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

    // أول وآخر لحظة في الشهر المطلوب
    filter.expenseDate = {
      $gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
      $lte: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  const records = await ExpenseModel.find(filter).sort({ expenseDate: -1 });

  // إجمالي الفترة المعروضة
  const periodAmount = records.reduce((sum, record) => sum + record.amount, 0);

  // إجمالي كل السجلات (كل الشهور) - بيتحسب في الداتا بيز من غير ما نجيب المستندات
  const grandTotalResult = await ExpenseModel.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalAmount = grandTotalResult[0]?.total || 0;

  // إجمالي الشهر الحالي مهما كان الشهر المعروض
  const currentMonthResult = await ExpenseModel.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0),
          $lte: new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
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

export const getExpenseById = asyncHandler(async (req, res, next) => {
  const expense = await ExpenseModel.findById(req.params.id);

  if (!expense) {
    return next(new ApiError("المصروف غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    data: expense,
  });
});

// ================== Update Expense ==================

export const updateExpense = asyncHandler(async (req, res, next) => {
  const expense = await ExpenseModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!expense) {
    return next(new ApiError("المصروف غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم تعديل المصروف بنجاح",
    data: expense,
  });
});

// ================== Delete Expense ==================

export const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await ExpenseModel.findByIdAndDelete(req.params.id);

  if (!expense) {
    return next(new ApiError("المصروف غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم حذف المصروف بنجاح",
  });
});
