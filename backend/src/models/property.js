import mongoose from "mongoose";


const PropertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'الاسم مطلوب'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'يجب ادخال عنوان العقار'],
        trim: true
    }
},{timestamps:true,versionKey: false});

const PropertyModel = mongoose.model("Property",PropertySchema);

export default PropertyModel;