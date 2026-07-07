import PropertyModel from '../models/property.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';





export const createProperty = asyncHandler(async (req, res) => {
    const newProperty = await PropertyModel.create(req.body);

    res.status(201).json({
        success: true,
        message: "تم إضافة العقار بنجاح",
        data: newProperty,
    });
});

export const getAllProperties = asyncHandler(async (req, res) => {
    const properties = await PropertyModel.find();
    res.status(200).json({
        success: true,
        total: properties.length,
        message: "تم جلب جميع العقارات بنجاح",
        data: properties
    });
});

export const getPropertyById = asyncHandler(async (req, res, next) => {
    const property = await PropertyModel.findById(req.params.id);

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }
    res.status(200).json({
        success: true,
        message: "تم جلب العقار بنجاح",
        data: property
    });
});

export const updateProperty = asyncHandler(async (req, res, next) => {
    const property = await PropertyModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        message: "تم تحديث العقار بنجاح",
        data: property
    });
});

export const deleteProperty = asyncHandler(async (req, res, next) => {
    const property = await PropertyModel.findByIdAndDelete(req.params.id);

    if (!property) {
        return next(new ApiError("العقار غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        message: "تم حذف العقار بنجاح",
        data: property
    });
});

export const getPropertiesByOwner = asyncHandler(async (req, res, next) => {
    const { ownerId } = req.params;

    const properties = await PropertyModel.find({ owner: ownerId });

    res.status(200).json({
        success: true,
        total: properties.length,
        message: "تم جلب عقارات المالك بنجاح",
        data: properties
    });
});