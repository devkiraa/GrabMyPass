import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error verifying admin access' });
    }
};
