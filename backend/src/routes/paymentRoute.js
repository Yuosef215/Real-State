import express from "express";
import { createPayment, getAllPayments ,getPaymentById,updatePayment,deletePayment,getPaymentSummary,getContractArrears} from "../services/paymentServices.js";
import protect from "../middleware/authMiddleware.js";




const router = express.Router();

router.use(protect);


router.post("/create_payment", createPayment);
router.get("/all_payments", getAllPayments);
router.get("/payment/:id", getPaymentById);
router.get("/payment-summary/:contractId", getPaymentSummary);
router.get("/arrears/:contractId", getContractArrears);
router.put("/payment/:id", updatePayment);
router.delete("/payment/:id", deletePayment);

export default router;