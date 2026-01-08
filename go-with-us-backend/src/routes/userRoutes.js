import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getProfile, updateProfile } from '../controllers/userController.js';

const router = express.Router();

// Protected routes
router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
