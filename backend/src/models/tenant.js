import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "يجب إدخال اسم المستأجر"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "يجب إدخال رقم الهاتف"],
      trim: true,
    },

    nationalId: {
      type: String,
      required: [true, "يجب إدخال الرقم القومي"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const TenantModel =  mongoose.model("Tenant", TenantSchema);

export default TenantModel;