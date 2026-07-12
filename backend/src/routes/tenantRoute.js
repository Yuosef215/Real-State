import express from 'express';
import {
    createTenant,
    getAllTenants,
    getTenantById,
    updateTenant,
    deleteTenant
} from '../services/tenantServices.js';
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.use(protect);

router.post("/create_tenant",createTenant);
router.get("/getAll_tenants",getAllTenants);
router.get("/getTenant/:id",getTenantById);
router.put("/update_tenant/:id",updateTenant);
router.delete("/delete_tenant/:id",deleteTenant);



export default router;