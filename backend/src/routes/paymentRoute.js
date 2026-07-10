import express from "express";
import { createPayment, getAllPayments ,getPaymentById,updatePayment,deletePayment} from "../services/paymentServices.js";





const router = express.Router();


router.post("/create_payment", createPayment);
router.get("/all_payments", getAllPayments);
router.get("/payment/:id", getPaymentById);
router.put("/payment/:id", updatePayment);
router.delete("/payment/:id", deletePayment);

export default router;