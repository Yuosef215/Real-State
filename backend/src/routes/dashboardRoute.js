import express from "express";
import { getDashboard ,getUnpaidContracts} from "../services/dashboardServices.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/get_dashboard", getDashboard);
router.get("/get_unpaid", getUnpaidContracts);

export default router;