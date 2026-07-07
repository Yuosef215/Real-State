import ApiError from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';
import UserModel from '../models/user.js';
import bcrypt from 'bcryptjs';
import createToken from '../utils/generateToken.js';




export const createUser = asyncHandler(async (req, res, next) => {
    const { name, code, password } = req.body;

    if (!name || !code || !password) {
        return next(new ApiError("Please enter all required fields", 400));
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const user = new UserModel({ name, code, password: hashpassword });
    const token = createToken(user._id);
    await user.save();
    res.status(201).json({ message: "User created succesfully", data: user, token });
});


export const loginUser = asyncHandler(async (req, res, next) => {
    const { code, password } = req.body;
    if (!code || !password) {
        return next(new ApiError("Please enter all required fields", 400));
    }
    const user = await UserModel.findOne({ code });
    if (!user) {
        return next(new ApiError("Invalid code or password", 401));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(new ApiError("Invalid code or password", 401));
    }
    const token = createToken(user._id);
    res.status(200).json({ message: "Login successful", data: user, token });
});