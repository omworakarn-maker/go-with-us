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
