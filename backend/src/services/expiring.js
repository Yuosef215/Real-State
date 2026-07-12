import asyncHandler from "express-async-handler";
import ContractModel from "../models/contract.js";




export const expiringContracts = asyncHandler(async (req, res, next) => {
    const today = new Date();

    const after30Days = new Date();
    after30Days.setDate(today.getDate() + 30);

    const contracts = await ContractModel.find({
        status: "نشط",
        endDate: {
            $gte: today,
            $lte: after30Days,
        },
    })
        .populate("tenant")
        .populate({
            path: "unit",
            populate: {
                path: "property",
            },
        });
    res.status(200).json({
        success: true,
        data: contracts
    });
});