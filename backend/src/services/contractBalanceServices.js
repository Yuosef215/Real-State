import asyncHandler from 'express-async-handler';
import ContractModel from '../models/contract.js';
import PaymentModel from '../models/payment.js';
import ApiError from '../utils/apiError.js';

// حساب عدد الشهور من تاريخ بداية معين لحد الشهر/السنة الحاليين (شامل الشهرين)
function countMonthsBetween(startDate, today) {
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    return (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
}

// @desc    حساب رصيد عقد معين: المطلوب / المدفوع / المتبقي
export const getContractBalance = asyncHandler(async (req, res, next) => {
    const { contractId } = req.params;

    const contract = await ContractModel.findById(contractId);
    if (!contract) {
        return next(new ApiError("العقد غير موجود", 404));
    }

    // كل دفعات الإيجار (مش التأمين) الخاصة بالعقد ده
    const payments = await PaymentModel.find({
        contract: contractId,
        paymentType: "إيجار",
    }).sort({ year: 1, month: 1 });

    const today = new Date();

    // أول شهر نحسب منه هو شهر أول دفعة اتسجلت، أو تاريخ بداية العقد لو مفيش دفعات لسه
    let startDate;
    if (payments.length > 0) {
        const firstPayment = payments[0];
        startDate = new Date(firstPayment.year, firstPayment.month - 1, 1);
    } else {
        startDate = new Date(contract.startDate);
    }

    const monthsElapsed = Math.max(countMonthsBetween(startDate, today), 1);

    const totalRequired = monthsElapsed * contract.monthlyRent;
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remainingBalance = totalRequired - totalPaid;

    res.status(200).json({
        success: true,
        data: {
            contractId,
            monthlyRent: contract.monthlyRent,
            monthsElapsed,
            totalRequired,
            totalPaid,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
            isFullyPaid: remainingBalance <= 0,
        },
    });
});
