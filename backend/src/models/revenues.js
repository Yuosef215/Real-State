import mongoose from "mongoose";

const revenuesSchema = new mongoose.Schema(
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
    revenuesDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const RevenuesModel = mongoose.model("Revenues", revenuesSchema);

export default RevenuesModel;
