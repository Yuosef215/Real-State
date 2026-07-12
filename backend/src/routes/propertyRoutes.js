import express from 'express';
import {
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
} from '../services/propertyServices.js';
import protect from '../middleware/authMiddleware.js';



const router = express.Router();

router.use(protect);


router.post("/create_property",createProperty);
router.get("/getAll_properties",getAllProperties);
router.get("/getProperty/:id",getPropertyById);
router.put("/update_property/:id",updateProperty);
router.delete("/delete_property/:id",deleteProperty);



export default router;