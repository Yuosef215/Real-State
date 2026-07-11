import ApiError from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';
import UnitModel from '../models/unit.js';
import PropertyModel from '../models/property.js';



export const createUnit = asyncHandler(async (req, res, next) => {
    const { propertyId } = req.params;
    const { unitNumber, status, floor } = req.body;

    const unit = await UnitModel.create({
        property: propertyId,
        unitNumber,
        status: 'متاحه',
        floor
    });
    const property = await PropertyModel.findById(propertyId);
    if (!property) {
    return next(new ApiError("العقار غير موجود", 404));
}

    res.status(201).json({
        status: "success",
        data: unit
    });
});

export const getAllUnits = asyncHandler(async (req, res) => {
    const units = await UnitModel.find().populate('property').populate('contracts');
    res.status(200).json({
        status: "success",
        results: units.length,
        data: units
    });
});
export const getUnitsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
console.log(req.params.propertyId);
  const units = await UnitModel.find({
    property: propertyId,
    status: "متاحه",
  }).populate("property");

  res.status(200).json({
    success: true,
    results: units.length,
    data: units,
  });
});

export const getUnitById = asyncHandler(async (req, res, next) => {
    const unit = await UnitModel.findById(req.params.id).populate('property');  

    if (!unit) {
        return next(new ApiError("الوحدة غير موجودة", 404));
    }

    res.status(200).json({
        status: "success",
        data: unit
    });
});

export const updateUnit = asyncHandler(async (req, res, next) => {
    const unit = await UnitModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!unit) {
        return next(new ApiError("الوحدة غير موجودة", 404));
    }

    res.status(200).json({
        status: "success",
        data: unit
    });
});

export const deleteUnit = asyncHandler(async (req, res, next) => {
    const unit = await UnitModel.findByIdAndDelete(req.params.id);

    if (!unit) {
        return next(new ApiError("الوحدة غير موجودة", 404));
    }

    res.status(200).json({
        status: "success",
        data: unit
    });
});

