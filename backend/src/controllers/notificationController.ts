import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

// Get user's notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { limit = 20, page = 1, unreadOnly = false } = req.query;

        const query: any = { userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate('eventId', 'title slug');

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.json({
            notifications,
            unreadCount,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

// Mark single notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark as read' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark all as read' });
    }
};

// Delete single notification
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { notificationId } = req.params;

        const result = await Notification.deleteOne({ _id: notificationId, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete notification' });
    }
};

// Clear all notifications
export const clearAllNotifications = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        await Notification.deleteMany({ userId });

        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear notifications' });
    }
};

// Get unread count only
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const count = await Notification.countDocuments({ userId, isRead: false });

        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get unread count' });
    }
};

// Helper function to create notification (used internally)
export const createNotification = async (data: {
    userId: string;
    type: 'registration' | 'check_in' | 'event_update' | 'coordinator_invite' | 'system' | 'waitlist' | 'approval';
    title: string;
    message: string;
    eventId?: string;
    ticketId?: string;
    data?: any;
}) => {
    try {
        const notification = await Notification.create(data);
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};
