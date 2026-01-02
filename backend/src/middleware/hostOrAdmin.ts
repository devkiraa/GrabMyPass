import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

/**
 * Middleware to check if user is admin or host
 * Used for payment verification endpoints
 */
export const verifyAdminOrHost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({ message: 'Access denied: User not found' });
        }

        if (user.role !== 'admin' && user.role !== 'host') {
            return res.status(403).json({ message: 'Access denied: Admin or Host access required' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error verifying access' });
    }
};
