import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createRevenues,
  updateRevenues,
  getAllRevenues,
  getRevenuesById,
  deleteRevenues,
} from "../services/revenuesServices.js";

const router = express.Router();

router.use(protect);

router.post("/create-revenues", createRevenues);
router.get("/get-all-revenues", getAllRevenues);
router.get("/get-one-revenues/:id", getRevenuesById);
router.put("/update-revenues/:id", updateRevenues);
router.delete("/delete-revenues/:id", deleteRevenues);

export default router;
