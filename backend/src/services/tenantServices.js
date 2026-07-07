import ApiError from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';
import TenantModel from '../models/tenant.js';




export const createTenant = asyncHandler(async (req, res, next) => {
    const { name, phone, nationalId } = req.body;

    if (!name || !phone || !nationalId) {
        return next(new ApiError("يجب إدخال بيانات المستأجر", 400));
    }

    const nationalExists = await TenantModel.findOne({ nationalId });

    if (nationalExists) {
        return next(new ApiError("هذا الرقم القومي موجود بالفعل", 400));
    }

    const newTenant = await TenantModel.create({
        name,
        phone,
        nationalId,
    });

    res.status(201).json({
        success: true,
        data: newTenant,
    });
});

export const getAllTenants = asyncHandler(async (req, res) => {
    const tenants = await TenantModel.find();
    res.status(200).json({
        success: true,
        total: tenants.length,
        data: tenants
    });
});

export const getTenantById = asyncHandler(async (req, res, next) => {
    const tenant = await TenantModel.findById(req.params.id);

    if (!tenant) {
        return next(new ApiError("المستأجر غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        data: tenant
    });
});

export const updateTenant = asyncHandler(async (req, res, next) => {
    const tenant = await TenantModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!tenant) {
        return next(new ApiError("المستأجر غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        data: tenant
    });
});

export const deleteTenant = asyncHandler(async (req, res, next) => {
    const tenant = await TenantModel.findByIdAndDelete(req.params.id);

    if (!tenant) {
        return next(new ApiError("المستأجر غير موجود", 404));
    }

    res.status(200).json({
        success: true,
        data: tenant
    });
});