import express from 'express';
import {
    createUnit,
    getAllUnits,
    getUnitById,
    updateUnit,
    deleteUnit
} from '../services/unitServices.js';

const router = express.Router();

router.post('/create_units/:propertyId', createUnit);
router.get('/getAll_units', getAllUnits);
router.get('/getUnit/:id', getUnitById);
router.put('/update_unit/:id', updateUnit);
router.delete('/delete_unit/:id', deleteUnit);

export default router;