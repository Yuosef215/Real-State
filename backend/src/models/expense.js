import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    // العقار اللي المصروف ده عليه - اختياري، null يعني مصروف عام مش مرتبط بعقار
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const expenseModel = mongoose.model("Expense", expenseSchema);

export default expenseModel;
