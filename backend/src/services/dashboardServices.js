import asyncHandler from "express-async-handler";
import PropertyModel from "../models/property.js";
import UnitModel from "../models/unit.js";
import TenantModel from "../models/tenant.js";
import ContractModel from "../models/contract.js";
import PaymentModel from "../models/payment.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // =========================
    // Counts
    // =========================

    const totalProperties = await PropertyModel.countDocuments();

    const totalUnits = await UnitModel.countDocuments();

    const availableUnits = await UnitModel.countDocuments({
        status: "متاحه",
    });

    const rentedUnits = await UnitModel.countDocuments({
        status: "مستأجره",
    });

    const totalTenants = await TenantModel.countDocuments();

    const activeContracts = await ContractModel.countDocuments({
        status: "نشط",
    });

    // =========================
    // Monthly Revenue
    // =========================

    const monthlyPayments = await PaymentModel.find({
        month: currentMonth,
        year: currentYear,
        paymentType: "إيجار",
    });

    const monthlyRevenue = monthlyPayments.reduce(
        (sum, payment) => sum + payment.amountPaid,
        0
    );

    // =========================
    // Daily Revenue
    // =========================

    const startOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
    );

    const endOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
    );

    const dailyPayments = await PaymentModel.find({
        paymentType: "إيجار",
        paymentDate: {
            $gte: startOfDay,
            $lt: endOfDay,
        },
    });

    const dailyRevenue = dailyPayments.reduce(
        (sum, payment) => sum + payment.amountPaid,
        0
    );

    // =========================
    // Response
    // =========================

    res.status(200).json({
        success: true,
        data: {
            totalProperties,
            totalUnits,
            availableUnits,
            rentedUnits,
            totalTenants,
            activeContracts,
            monthlyRevenue,
            dailyRevenue,
        },
    });
});

export const getUnpaidContracts = asyncHandler(async (req, res) => {

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const activeContracts = await ContractModel.find({
        status: "نشط",
    })
        .populate("tenant")
        .populate({
            path: "unit",
            populate: {
                path: "property",
            },
        });

    const payments = await PaymentModel.find({
        month,
        year,
        paymentType: "إيجار",
    });

    const paidContracts = payments.map(payment =>
        payment.contract.toString()
    );

    const unpaidContracts = activeContracts.filter(
        contract => !paidContracts.includes(contract._id.toString())
    );

    res.status(200).json({
        success: true,
        results: unpaidContracts.length,
        data: unpaidContracts,
    });
});