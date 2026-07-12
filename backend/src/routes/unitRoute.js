import express from 'express';
import {
    createUnit,
    getAllUnits,
    getUnitById,
    updateUnit,
    deleteUnit,
    getUnitsByProperty
} from '../services/unitServices.js';
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.use(protect);

router.post('/create_units/:propertyId', createUnit);
router.get('/getAll_units', getAllUnits);
router.get('/getUnit/:id', getUnitById);
router.get("/property/:propertyId", getUnitsByProperty);
router.put('/update_unit/:id', updateUnit);
router.delete('/delete_unit/:id', deleteUnit);

export default router;