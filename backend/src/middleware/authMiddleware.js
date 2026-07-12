import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import UserModel from "../models/user.js";

// @desc    التأكد من وجود توكن صالح قبل السماح بالوصول للـ route
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1) استخراج التوكن من الهيدر (Authorization: Bearer xxxxx)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new ApiError("غير مصرح لك بالوصول، من فضلك سجل الدخول أولاً", 401)
    );
  }

  // 2) التحقق من صحة التوكن
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(
      new ApiError("توكن غير صالح أو منتهي الصلاحية، من فضلك سجل الدخول مرة أخرى", 401)
    );
  }

  // 3) التأكد من أن المستخدم لسه موجود في قاعدة البيانات
  const currentUser = await UserModel.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError("المستخدم الخاص بهذا التوكن لم يعد موجوداً", 401)
    );
  }

  // 4) إرفاق بيانات المستخدم بالـ request عشان تستخدم لاحقاً لو محتاجين
  req.user = currentUser;
  next();
});

export default protect;
