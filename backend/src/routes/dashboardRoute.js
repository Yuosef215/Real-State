import express from "express";
import { getDashboard } from "../services/dashboardServices.js";

const router = express.Router();

router.get("/get_dashboard", getDashboard);

export default router;