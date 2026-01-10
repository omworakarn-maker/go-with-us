import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                interests: true, // Included interests
                createdAt: true,
                trips: {
                    orderBy: { startDate: 'desc' },
                    include: {
                        participants: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const joinedTrips = await prisma.participant.findMany({
            where: { userId },
            orderBy: { joinedAt: 'desc' },
            include: {
                trip: {
                    include: {
                        participants: true
                    }
                }
            }
        });

        const response = {
            ...user,
            createdTrips: user.trips,
            participatedTrips: joinedTrips
        };
        delete response.trips;

        res.json(response);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, password, interests } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (interests) updateData.interests = interests; // Array of strings
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                interests: true
            }
        });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// Get all users (searchable)
export const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        // Don't include current user in search results? Optional, but good practice.
        const currentUserId = req.user.userId;

        const whereClause = {};
        if (search) {
            whereClause.name = {
                contains: search,
                mode: 'insensitive' // Requires PostgreSQL and Prisma config, or use lower case logic if using simple DB
            };
        }

        // Exclude self
        whereClause.id = { not: currentUserId };

        const users = await prisma.user.findMany({
            where: whereClause,
            take: 20, // Limit results
            select: {
                id: true,
                name: true,
                email: true, // Maybe don't expose email publicly? Keeping it for now as unique ID reference
                // Avatar?
            },
            orderBy: { name: 'asc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};
