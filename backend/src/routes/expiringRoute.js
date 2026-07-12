import express from "express";
import { expiringContracts } from "../services/expiring.js";




const router = express.Router();

router.get("/expiring-contracts", expiringContracts);


export default router;