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

export const getAllExpenses = asyncHandler(async (req, res) => {
  const expenses = await ExpenseModel.find().sort({ expenseDate: -1 });

  // إجمالي كل المصروفات
  const totalAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  // الشهر الحالي
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // إجمالي مصروفات الشهر الحالي
  const monthlyAmount = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.expenseDate);

      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  res.status(200).json({
    success: true,
    results: expenses.length,
    totalAmount,
    monthlyAmount,
    data: expenses,
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
