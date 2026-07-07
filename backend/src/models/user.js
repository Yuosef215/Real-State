import mongoose from "mongoose";




const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required!'],
        trim: true
    },
    code: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    }
},{timestamps: true,versionKey: false});

const UserModel = mongoose.model("User",userSchema);

export default UserModel;