import express from 'express';
import {
    createUser,
    loginUser,
    changePassword
} from '../services/userServices.js';
import protect from '../middleware/authMiddleware.js';





const router = express.Router();


router.post("/create_user",createUser);
router.post("/login_user",loginUser);
router.put("/change_password",protect,changePassword);


export default router;