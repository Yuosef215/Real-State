import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    amountPaid: {
      type: Number,
      required: [true, "يجب إدخال المبلغ المدفوع"],
      min: 0,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["إيجار", "تأمين"],
      default: "إيجار",
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PaymentSchema.index(
  {
    contract: 1,
    month: 1,
    year: 1,
    paymentType: 1,
  }
);

export default mongoose.model("Payment", PaymentSchema);