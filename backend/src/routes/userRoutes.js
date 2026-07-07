import express from 'express';
import {
    createUser,
    loginUser
} from '../services/userServices.js';





const router = express.Router();


router.post("/create_user",createUser);
router.post("/login_user",loginUser);


export default router;