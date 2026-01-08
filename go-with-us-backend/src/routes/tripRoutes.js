import express from 'express';
import {
    getAllTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    joinTrip,
    leaveTrip,
} from '../controllers/tripController.js';
import { verifyToken, verifyTokenOptional } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with optional auth for recommendations)
router.get('/', verifyTokenOptional, getAllTrips);
router.get('/:id', getTripById);

// Protected routes (require authentication)
router.post('/', verifyToken, createTrip);
router.put('/:id', verifyToken, updateTrip);
router.delete('/:id', verifyToken, deleteTrip);
router.post('/:id/join', verifyToken, joinTrip);
router.delete('/:id/leave', verifyToken, leaveTrip);

export default router;
