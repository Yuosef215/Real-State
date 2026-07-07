import express from 'express';
import {
    createProperty,
    getAllProperties
} from '../services/propertyServices.js';



const router = express.Router();


router.post("/create_property",createProperty);
router.get("/getAll_properties",getAllProperties);



export default router;