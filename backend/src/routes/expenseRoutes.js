import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense
} from "../services/expenseServices.js";


const router = express.Router();

router.use(protect);

router.post("/create-expense",createExpense);
router.get("/get-all-expense",getAllExpenses);
router.get("/get-one-expense",getExpenseById);
router.put("/update-expense",updateExpense);
router.delete("/delete-expense",deleteExpense);


export default router;