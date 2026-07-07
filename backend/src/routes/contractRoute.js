import express from 'express';
import {
    createContract,
    getAllContracts
} from '../services/contractServices.js';




const router = express.Router();



router.post("/create_contract",createContract);
router.get("/get_contract",getAllContracts);




export default router;