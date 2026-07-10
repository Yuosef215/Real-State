import express from 'express';
import {
    createContract,
    getAllContracts,
    getContractById,
    updateContract,
    deleteContract
} from '../services/contractServices.js';




const router = express.Router();




router.post("/create_contract",createContract);
router.get("/get_contract",getAllContracts);
router.get("/get_contract/:id",getContractById);
router.put("/update_contract/:id",updateContract);
router.delete("/delete_contract/:id",deleteContract);




export default router;