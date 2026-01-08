import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
    getTripMessages,
    sendTripMessage,
    getPrivateMessages,
    sendPrivateMessage,
    getConversations,
    deleteConversation,
    deleteMessage,
} from '../controllers/messageController.js';

const router = express.Router();

// All message routes require authentication
router.use(verifyToken);

// Group Chat Routes (Trip Messages)
router.get('/trips/:tripId', getTripMessages);   // Get all messages in a trip
router.post('/trips/:tripId', sendTripMessage);   // Send message to a trip

// Private Chat Routes
router.get('/conversations', getConversations);           // Get list of conversations
router.get('/private/:userId', getPrivateMessages);       // Get messages with specific user
router.post('/private/:userId', sendPrivateMessage);      // Send message to specific user
router.delete('/private/:userId', deleteConversation);    // Delete conversation

// General Message Routes
router.delete('/:messageId', deleteMessage);              // Delete specific message (Unsend)

export default router;
