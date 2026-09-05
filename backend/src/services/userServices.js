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

    // المستند اللي لسه اتعمل بيبقى شايل الـ hash في الميموري، فبنشيله قبل الرد
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ message: "User created succesfully", data: userData, token });
});


export const loginUser = asyncHandler(async (req, res, next) => {
    const { code, password } = req.body;
    if (!code || !password) {
        return next(new ApiError("Please enter all required fields", 400));
    }
    // لازم نطلب الـ password صراحة لأنه select: false في الموديل
    const user = await UserModel.findOne({ code }).select("+password");
    if (!user) {
        return next(new ApiError("Invalid code or password", 401));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(new ApiError("Invalid code or password", 401));
    }
    const token = createToken(user._id);

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ message: "Login successful", data: userData, token });
});


// @desc    تغيير كلمة المرور للمستخدم الحالي
// @route   PUT /api/v1/users/change_password
// @access  محمي (لازم توكن)
export const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new ApiError("من فضلك أدخل جميع الحقول", 400));
    }

    if (newPassword.length < 6) {
        return next(
            new ApiError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", 400)
        );
    }

    if (newPassword !== confirmPassword) {
        return next(
            new ApiError("كلمة المرور الجديدة وتأكيدها غير متطابقين", 400)
        );
    }

    if (newPassword === currentPassword) {
        return next(
            new ApiError("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية", 400)
        );
    }

    const user = await UserModel.findById(req.user._id).select("+password");

    if (!user) {
        return next(new ApiError("المستخدم غير موجود", 404));
    }

    // التأكد إن اللي بيغير هو صاحب الحساب فعلاً
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        return next(new ApiError("كلمة المرور الحالية غير صحيحة", 401));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // توكن جديد عشان الجلسة تفضل شغالة بعد التغيير
    const token = createToken(user._id);

    res.status(200).json({
        success: true,
        message: "تم تغيير كلمة المرور بنجاح",
        token,
    });
});
