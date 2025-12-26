import { Request, Response } from 'express';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Ticket } from '../models/Ticket';
import fs from 'fs';
import path from 'path';

// Get System Overview Stats
export const getSystemStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalEvents = await Event.countDocuments();
        // Calculate total successful tickets (issued or checked-in)
        const totalTickets = await Ticket.countDocuments({
            status: { $in: ['issued', 'checked-in'] }
        });

        const activeEvents = await Event.countDocuments({ status: 'active' });

        // Get recent signups (last 5)
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role createdAt avatar');

        res.json({
            stats: {
                totalUsers,
                totalEvents,
                activeEvents,
                totalTickets
            },
            recentUsers
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Failed to fetch system stats' });
    }
};

// Start or fix issues functionality (placeholder for future)
export const runSystemHealthCheck = async (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date() });
};



export const getServerLogs = async (req: Request, res: Response) => {
    try {
        const logPath = path.join(__dirname, '../../logs/access.log');
        if (!fs.existsSync(logPath)) {
            return res.json({ logs: [] });
        }

        const data = fs.readFileSync(logPath, 'utf8');
        // Split by newline and take last 100
        const logs = data.split('\n').filter(Boolean).reverse().slice(0, 100);

        res.json({ logs });
    } catch (error) {
        console.error('Fetch logs error:', error);
        res.status(500).json({ message: 'Failed to fetch logs' });
    }
};

export const clearServerLogs = async (req: Request, res: Response) => {
    try {
        const logPath = path.join(__dirname, '../../logs/access.log');
        fs.writeFileSync(logPath, ''); // Clear file
        res.json({ message: 'Logs cleared successfully' });
    } catch (error) {
        console.error('Clear logs error:', error);
        res.status(500).json({ message: 'Failed to clear logs' });
    }
};
