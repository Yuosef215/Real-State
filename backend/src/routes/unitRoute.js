import express from 'express';
import {
    createUnit,
} from '../services/unitServices.js';

const router = express.Router();

router.post('/create_units/:propertyId', createUnit);


export default router;