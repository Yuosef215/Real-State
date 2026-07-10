import mongoose from "mongoose";


const UnitSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true
    },
    unitNumber: {
        type: Number,
        required: [true, "يجب إدخال رقم الوحدة"],
    },
    status: {
        type: String,
        enum: ["متاحه", "مستأجره"],
        default: "متاحه"
    },
    floor: {
        type: Number,
        required: [true, "يجب إدخال رقم الدور"]
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
        toObject: { virtuals: true },
});
UnitSchema.virtual("contracts", {
    ref: "Contract",
    localField: "_id",
    foreignField: "unit",
});
UnitSchema.index(
    { property: 1, floor: 1, unitNumber: 1 },
    { unique: true }
);

const UnitModel = mongoose.model("Unit", UnitSchema);

export default UnitModel;