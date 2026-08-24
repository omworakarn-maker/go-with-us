import prisma from '../utils/prismaClient.js';
import { generateEmbedding } from '../utils/gemini.js';
import { calculateTripCompatibilityDetailed } from './matchController.js';
import { calculateActivityStyleFromItinerary } from '../utils/tripActivityStyle.js';

const TRIP_INTEREST_CATEGORIES = new Set([
    'ทะเล', 'ภูเขา', 'แคมป์ปิ้ง', 'เที่ยวเมือง', 'คาเฟ่', 'อาหาร',
    'แฮงเอาต์', 'ถ่ายรูป', 'ช้อปปิ้ง', 'คอนเสิร์ต', 'ผจญภัย', 'ไหว้พระ'
]);

const normalizeTripInterestTags = (interestTags, category) => (
    [...new Set(Array.isArray(interestTags) ? interestTags : [])]
        .filter(tag => TRIP_INTEREST_CATEGORIES.has(tag) && tag !== category)
        .slice(0, 2)
);

// Get all trips with filters
export const getAllTrips = async (req, res, next) => {
    try {
        // Never delete historical trips while reading the list. Expired trips
        // remain in the database for the owner's history and reports.

        const { destination, category, startDate, endDate, type, limit } = req.query;
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
        
        const creatorId = req.query.creatorId;
        if (creatorId) {
            where.creatorId = creatorId;
        }
        
        const participantId = req.query.participantId;
        if (participantId) {
            where.participants = {
                some: { userId: participantId }
            };
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
                    where.OR = [
                        { category: { in: user.interests } },
                        { interestTags: { hasSome: user.interests } },
                        { creatorId: userId }
                    ];
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
                        profileImage: true,
                        travelStyle: true
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                profileImage: true,
                                travelStyle: true,
                                interests: true
                            }
                        }
                    }
                },
            },
            orderBy,
            take: limit ? parseInt(limit) : undefined
        });

        let responseTrips = trips;
        
        if (userId) {
            console.log("User is logged in for getAllTrips, calculating matchScore for userId:", userId);
            try {
                const currentUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { travelStyle: true, interests: true }
                });
                
                if (currentUser) {
                    responseTrips = trips.map(trip => {
                        const { total, breakdown } = calculateTripCompatibilityDetailed(currentUser, trip);
                        return {
                            ...trip,
                            matchScore: total,
                            matchBreakdown: breakdown
                        };
                    });
                    
                    // Sort by matchScore descending for recommendations
                    if (type === 'recommended') {
                        responseTrips.sort((a, b) => {
                            return (b.matchScore || 0) - (a.matchScore || 0);
                        });
                    }
                    
                    console.log(`Calculated matchScore for ${responseTrips.length} trips.`);
                } else {
                    console.log("Could not find currentUser for matchScore.");
                }
            } catch (err) {
                console.log("Error calculating match score for trips:", err);
            }
        } else {
            console.log("No userId found in getAllTrips. Auth header might be missing.");
        }

        res.json({ trips: responseTrips, count: responseTrips.length });
    } catch (error) {
        next(error);
    }
};

// Get trips created by the currently authenticated user.
// Ownership comes from the verified JWT, never from a client-supplied user id.
export const getMyCreatedTrips = async (req, res, next) => {
    try {
        const trips = await prisma.trip.findMany({
            where: { creatorId: req.user.userId },
            include: {
                creator: {
                    select: {
                        id: true, name: true, email: true, role: true,
                        profileImage: true, travelStyle: true
                    }
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true, name: true, email: true, role: true,
                                profileImage: true, travelStyle: true, interests: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
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
                        profileImage: true,
                        travelStyle: true
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                profileImage: true,
                                travelStyle: true,
                                interests: true
                            }
                        }
                    }
                },
            },
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        // Calculate matchScore if user is logged in
        let responseTrip = trip;
        const userId = req.user?.userId;
        if (userId) {
            try {
                const currentUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { travelStyle: true, interests: true }
                });
                if (currentUser) {
                    const { total, breakdown } = calculateTripCompatibilityDetailed(currentUser, trip);
                    responseTrip = {
                        ...trip,
                        matchScore: total,
                        matchBreakdown: breakdown
                    };
                }
            } catch (err) {
                // Non-critical — still return trip without score
            }
        }

        res.json({ trip: responseTrip });
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
            budgetType,
            maxParticipants,
            category,
            interestTags,
            imageUrl,
            gallery,
            itinerary,
            activityStyle,
            timeOfDay,
            isPublic
        } = req.body;

        // Validation
        if (!title || !destination || !startDate) {
            return res.status(400).json({
                error: 'Title, destination, and start date are required.',
            });
        }

        // Fetch user to get name for participant record
        const creator = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { name: true }
        });

        if (!creator) {
            return res.status(401).json({ error: 'Authenticated user no longer exists.' });
        }

        // Embedding is optional. A Gemini outage/quota error must never block trip creation.
        const normalizedInterestTags = normalizeTripInterestTags(interestTags, category);
        const generatedEmbedding = await generateEmbedding(
            `${title} ${description || ''} ${category || ''} ${normalizedInterestTags.join(' ')} ${destination}`
        );

        console.log(`Creating trip with ${gallery?.length || 0} gallery images and ${itinerary?.length || 0} itinerary days`);

        const trip = await prisma.trip.create({
            data: {
                title,
                destination,
                description: description || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                budget: (budget !== undefined && budget !== null) ? Number(budget) : 1000,
                budgetType: budgetType || 'per_person',
                maxParticipants: maxParticipants ? Number(maxParticipants) : 10,
                category: category || null,
                interestTags: normalizedInterestTags,
                imageUrl: (imageUrl !== undefined && imageUrl !== null) ? imageUrl : null,
                gallery: Array.isArray(gallery) ? gallery : (gallery ? [gallery] : []),
                itinerary: itinerary || [],
                activityStyle: calculateActivityStyleFromItinerary(itinerary, startDate, endDate),
                timeOfDay: Array.isArray(timeOfDay) ? timeOfDay : [],
                isPublic: isPublic !== undefined ? isPublic : true,
                creatorId: req.user.userId,
                ...(Array.isArray(generatedEmbedding) && generatedEmbedding.length > 0
                    ? { embedding: generatedEmbedding }
                    : {}),
                participants: {
                    create: {
                        userId: req.user.userId,
                        name: creator.name,
                        interests: []
                    }
                }
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
            budgetType,
            maxParticipants,
            category,
            interestTags,
            imageUrl,
            gallery,
            itinerary,
            activityStyle,
            timeOfDay,
            summary,
            groupAnalysis,
            isPublic
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

        const nextItinerary = itinerary !== undefined ? itinerary : existingTrip.itinerary;
        const nextStartDate = startDate || existingTrip.startDate;
        const nextEndDate = endDate !== undefined ? endDate : existingTrip.endDate;
        const shouldRecalculateActivityStyle = itinerary !== undefined || startDate !== undefined || endDate !== undefined;
        const nextCategory = category !== undefined ? category : existingTrip.category;
        const nextInterestTags = interestTags !== undefined
            ? normalizeTripInterestTags(interestTags, nextCategory)
            : normalizeTripInterestTags(existingTrip.interestTags, nextCategory);
        const shouldRegenerateEmbedding = Boolean(
            title || description !== undefined || category !== undefined || interestTags !== undefined || destination
        );
        const updatedEmbedding = shouldRegenerateEmbedding
            ? await generateEmbedding(
                `${title || existingTrip.title} ${description !== undefined ? description : (existingTrip.description || '')} ${nextCategory || ''} ${nextInterestTags.join(' ')} ${destination || existingTrip.destination}`
            )
            : null;

        const trip = await prisma.trip.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(destination && { destination }),
                ...(description !== undefined && { description }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(budget !== undefined && { budget }),
                ...(budgetType !== undefined && { budgetType }),
                ...(maxParticipants && { maxParticipants }),
                ...(category !== undefined && { category }),
                ...(interestTags !== undefined && { interestTags: nextInterestTags }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(isPublic !== undefined && { isPublic }),
                ...(gallery !== undefined && { gallery }),
                ...(itinerary !== undefined && { itinerary }),
                ...(shouldRecalculateActivityStyle && {
                    activityStyle: calculateActivityStyleFromItinerary(nextItinerary, nextStartDate, nextEndDate)
                }),
                ...(timeOfDay !== undefined && { timeOfDay: Array.isArray(timeOfDay) ? timeOfDay : [] }),
                ...(summary !== undefined && { summary }),
                ...(groupAnalysis !== undefined && { groupAnalysis }),
                // Regenerate only when Gemini returns a valid vector.
                ...(Array.isArray(updatedEmbedding) && updatedEmbedding.length > 0
                    ? { embedding: updatedEmbedding }
                    : {}),
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
        const { name, interests, status } = req.body;

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
            const updatedParticipant = await prisma.participant.update({
                where: {
                    tripId_userId: {
                        tripId: id,
                        userId: req.user.userId
                    }
                },
                data: {
                    name,
                    interests: interests || [],
                    status: status || 'going'
                }
            });
            return res.json({
                message: 'Participant updated successfully',
                participant: updatedParticipant
            });
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
                status: status || 'going',
            },
        });

        // Notify existing participants
        if (trip.participants && trip.participants.length > 0) {
            const notifications = trip.participants.map((p) => ({
                title: 'มีสมาชิกใหม่เข้าร่วมทริป!',
                message: `${name} ได้เข้าร่วมทริป "${trip.title}" แล้ว`,
                type: 'trip',
                targetId: id,
                userId: p.userId,
            }));

            await prisma.notification.createMany({
                data: notifications,
            });
        }

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

// Remove participant (kick) - Protected (Creator/Admin only)
export const removeParticipant = async (req, res, next) => {
    try {
        const { id, userId } = req.params;

        // Check trip existence
        const trip = await prisma.trip.findUnique({
            where: { id },
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        // Check authorization (Creator or Admin)
        if (trip.creatorId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You do not have permission to remove participants.' });
        }

        // Find participant record to remove
        const participant = await prisma.participant.findFirst({
            where: {
                tripId: id,
                userId: userId,
            },
        });

        if (!participant) {
            return res.status(404).json({ error: 'User is not a participant of this trip.' });
        }

        // Check if trying to remove creator (should not happen via UI, but safe to block)
        if (userId === trip.creatorId) {
            return res.status(400).json({ error: 'Cannot remove the trip creator.' });
        }

        await prisma.participant.delete({
            where: {
                id: participant.id,
            },
        });

        res.json({ message: 'Participant removed successfully.' });
    } catch (error) {
        next(error);
    }
};
