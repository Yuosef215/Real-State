import express from 'express';
import {
    createTenant
} from '../services/tenantServices.js'


const router = express.Router();



router.post("/create_tenant",createTenant);



export default router;