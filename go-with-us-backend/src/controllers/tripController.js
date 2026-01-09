import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all trips with filters
export const getAllTrips = async (req, res, next) => {
    try {
        // --- AUTO CLEANUP LOGIC ---
        // Delete trips ended more than 1 day ago
        const cleanupDate = new Date();
        cleanupDate.setDate(cleanupDate.getDate() - 1); // 1 day ago

        await prisma.trip.deleteMany({
            where: {
                endDate: {
                    lt: cleanupDate
                }
            }
        });
        // --------------------------

        const { destination, category, startDate, endDate, type } = req.query;
        const userId = req.user?.userId; // Optional, might be available if using verifyToken optionally or passed

        const where = {};

        if (destination) {
            where.destination = { contains: destination, mode: 'insensitive' };
        }

        if (category && category !== 'ทุกหมวดหมู่') {
            where.category = category;
        }

        if (startDate) {
            where.startDate = { gte: new Date(startDate) };
        }

        if (endDate) {
            where.endDate = { lte: new Date(endDate) };
        }

        let orderBy = { createdAt: 'desc' }; // Default: Newest

        if (type === 'popular') {
            orderBy = { participants: { _count: 'desc' } };
        } else if (type === 'recommended' && userId) {
            // Fetch user interests first
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { interests: true }
                });

                if (user?.interests?.length > 0) {
                    where.category = { in: user.interests };
                }
            } catch (err) {
                console.log('Error fetching user for recommendation:', err);
            }
        }

        const trips = await prisma.trip.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        userId: true,
                        name: true,
                        interests: true,
                        joinedAt: true,
                    },
                },
            },
            orderBy,
        });

        res.json({ trips, count: trips.length });
    } catch (error) {
        next(error);
    }
};

// Get single trip by ID
export const getTripById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        userId: true,
                        name: true,
                        interests: true,
                        joinedAt: true,
                    },
                },
            },
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        res.json({ trip });
    } catch (error) {
        next(error);
    }
};

// Create new trip (protected)
export const createTrip = async (req, res, next) => {
    try {
        const {
            title,
            destination,
            description,
            startDate,
            endDate,
            budget,
            maxParticipants,
            category,
            imageUrl,
        } = req.body;

        // Validation
        if (!title || !destination || !startDate) {
            return res.status(400).json({
                error: 'Title, destination, and start date are required.',
            });
        }

        const trip = await prisma.trip.create({
            data: {
                title,
                destination,
                description: description || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                budget: budget && budget >= 100 ? budget : 1000,
                maxParticipants: maxParticipants || 10,
                category: category || null,
                imageUrl: imageUrl || null,
                creatorId: req.user.userId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Trip created successfully',
            trip,
        });
    } catch (error) {
        next(error);
    }
};

// Update trip (protected - creator or admin only)
export const updateTrip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title,
            destination,
            description,
            startDate,
            endDate,
            budget,
            maxParticipants,
            category,
            imageUrl,
            gallery,
            itinerary,
        } = req.body;

        // Check if trip exists
        const existingTrip = await prisma.trip.findUnique({
            where: { id },
        });

        if (!existingTrip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        // Check authorization
        if (
            existingTrip.creatorId !== req.user.userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                error: 'You do not have permission to update this trip.',
            });
        }

        const trip = await prisma.trip.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(destination && { destination }),
                ...(description !== undefined && { description }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(budget && { budget }),
                ...(maxParticipants && { maxParticipants }),
                ...(category !== undefined && { category }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(gallery !== undefined && { gallery }),
                ...(itinerary !== undefined && { itinerary }),
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                participants: true,
            },
        });

        res.json({
            message: 'Trip updated successfully',
            trip,
        });
    } catch (error) {
        next(error);
    }
};

// Delete trip (protected - creator or admin only)
export const deleteTrip = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if trip exists
        const existingTrip = await prisma.trip.findUnique({
            where: { id },
        });

        if (!existingTrip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        // Check authorization
        if (
            existingTrip.creatorId !== req.user.userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                error: 'You do not have permission to delete this trip.',
            });
        }

        await prisma.trip.delete({
            where: { id },
        });

        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Join trip (protected)
export const joinTrip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, interests } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required.' });
        }

        // Check if trip exists
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                participants: true,
            },
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        // Check if already joined
        const alreadyJoined = trip.participants.some(
            (p) => p.userId === req.user.userId
        );

        if (alreadyJoined) {
            return res.status(400).json({ error: 'You have already joined this trip.' });
        }

        // Check if trip is full
        if (trip.participants.length >= trip.maxParticipants) {
            return res.status(400).json({ error: 'This trip is full.' });
        }

        const participant = await prisma.participant.create({
            data: {
                tripId: id,
                userId: req.user.userId,
                name,
                interests: interests || [],
            },
        });

        res.status(201).json({
            message: 'Successfully joined the trip',
            participant,
        });
    } catch (error) {
        next(error);
    }
};

// Leave trip (protected)
export const leaveTrip = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find participant record
        const participant = await prisma.participant.findFirst({
            where: {
                tripId: id,
                userId: req.user.userId,
            },
        });

        if (!participant) {
            return res.status(404).json({ error: 'You are not a participant of this trip.' });
        }

        await prisma.participant.delete({
            where: {
                id: participant.id,
            },
        });

        res.json({ message: 'Successfully left the trip' });
    } catch (error) {
        next(error);
    }
};
