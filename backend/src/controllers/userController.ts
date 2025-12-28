import { Request, Response } from 'express';
import { User } from '../models/User';
import { Event } from '../models/Event';

export const getPublicUserProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;

        // First try to find by exact username
        let user = await User.findOne({ username }).select('-password -googleId -smtpConfig -__v');

        // If not found, try to find by email prefix (for users without explicit username)
        if (!user) {
            // Search for user where email starts with the username parameter
            user = await User.findOne({
                email: { $regex: `^${username}@`, $options: 'i' }
            }).select('-password -googleId -smtpConfig -__v');
        }

        // If still not found, try to find by name (lowercase, no spaces)
        if (!user) {
            const namePattern = username.toLowerCase();
            const allUsers = await User.find().select('-password -googleId -smtpConfig -__v');
            user = allUsers.find(u => {
                const normalizedName = (u.name || '').toLowerCase().replace(/\s+/g, '');
                return normalizedName === namePattern;
            }) || null;
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch public events for this user
        const events = await Event.find({
            hostId: user._id,
            status: 'active' // Only show active/published events
        }).select('title slug date location description price banner');

        res.json({
            user,
            events
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error });
    };
};
