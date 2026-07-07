import mongoose from "mongoose";

const ContractSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    monthlyRent: {
      type: Number,
      required: [true, "يجب إدخال قيمة الإيجار"],
      min: 0,
    },

    startDate: {
      type: Date,
      required: [true, "يجب إدخال تاريخ بداية العقد"],
    },

    endDate: {
      type: Date,
      required: [true, "يجب إدخال تاريخ نهاية العقد"],
    },

    status: {
      type: String,
      enum: ["نشط", "منتهي"],
      default: "نشط",
    },
    securityDeposit: {
    type: Number,
    required: [true, "يجب إدخال مبلغ التأمين"],
    min: 0
},
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Contract", ContractSchema);