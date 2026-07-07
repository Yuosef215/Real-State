import express from 'express';
import {
    createTenant,
    getAllTenants,
    getTenantById,
    updateTenant,
    deleteTenant
} from '../services/tenantServices.js';


const router = express.Router();



router.post("/create_tenant",createTenant);
router.get("/getAll_tenants",getAllTenants);
router.get("/getTenant/:id",getTenantById);
router.put("/update_tenant/:id",updateTenant);
router.delete("/delete_tenant/:id",deleteTenant);



export default router;