import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all messages for a trip (Group Chat)
export const getTripMessages = async (req, res, next) => {
    try {
        const { tripId } = req.params;

        // Check if user is a participant of the trip
        const participant = await prisma.participant.findFirst({
            where: {
                tripId,
                userId: req.user.userId,
            },
        });

        if (!participant) {
            return res.status(403).json({
                error: 'You must be a participant to view messages.'
            });
        }

        const messages = await prisma.message.findMany({
            where: { tripId },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.json({ messages });
    } catch (error) {
        next(error);
    }
};

// Send a message to a trip (Group Chat)
export const sendTripMessage = async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required.' });
        }

        // Check if user is a participant
        const participant = await prisma.participant.findFirst({
            where: {
                tripId,
                userId: req.user.userId,
            },
        });

        if (!participant) {
            return res.status(403).json({
                error: 'You must be a participant to send messages.'
            });
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                senderId: req.user.userId,
                tripId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
};

// Get private messages between two users
export const getPrivateMessages = async (req, res, next) => {
    try {
        const { userId } = req.params; // The other user ID
        const currentUserId = req.user.userId;

        const messages = await prisma.message.findMany({
            where: {
                AND: [
                    { tripId: null }, // Private messages only
                    {
                        OR: [
                            // Messages sent by current user to other user
                            {
                                senderId: currentUserId,
                                recipientId: userId,
                            },
                            // Messages sent by other user to current user
                            {
                                senderId: userId,
                                recipientId: currentUserId,
                            },
                        ],
                    },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.json({ messages });
    } catch (error) {
        next(error);
    }
};

// Send a private message to another user
export const sendPrivateMessage = async (req, res, next) => {
    try {
        const { userId } = req.params; // Recipient ID
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required.' });
        }

        // Check if recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found.' });
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                senderId: req.user.userId,
                recipientId: userId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
};

// Get all conversations (list of users you've chatted with)
export const getConversations = async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;

        // Get all private messages involving current user
        const messages = await prisma.message.findMany({
            where: {
                AND: [
                    { tripId: null },
                    {
                        OR: [
                            { senderId: currentUserId },
                            { recipientId: currentUserId },
                        ],
                    },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Extract unique users (excluding current user)
        const userMap = new Map();
        messages.forEach(msg => {
            const otherUser = msg.senderId === currentUserId ? msg.recipient : msg.sender;
            if (otherUser && !userMap.has(otherUser.id)) {
                userMap.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg,
                });
            }
        });

        const conversations = Array.from(userMap.values());

        res.json({ conversations });
    } catch (error) {
        next(error);
    }
};

// Delete a conversation with a specific user
export const deleteConversation = async (req, res, next) => {
    try {
        const { userId } = req.params; // The other user ID
        const currentUserId = req.user.userId;

        await prisma.message.deleteMany({
            where: {
                AND: [
                    { tripId: null }, // Private messages only
                    {
                        OR: [
                            { senderId: currentUserId, recipientId: userId },
                            { senderId: userId, recipientId: currentUserId }
                        ]
                    }
                ]
            }
        });

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Delete a single message (Unsend)
export const deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const currentUserId = req.user.userId;

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Only the sender can delete their message
        if (message.senderId !== currentUserId) {
            return res.status(403).json({ error: 'You can only delete your own messages.' });
        }

        await prisma.message.delete({
            where: { id: messageId }
        });

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        next(error);
    }
};
