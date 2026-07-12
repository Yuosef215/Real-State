import express from "express";
import { getDashboard } from "../services/dashboardServices.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/get_dashboard", getDashboard);

export default router;