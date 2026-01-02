import express from 'express';
import { validateApiKey, requirePermission } from '../middleware/apiKey';
import { Event } from '../models/Event';
import { Ticket } from '../models/Ticket';
import { Payment } from '../models/Payment';
import { logger } from '../lib/logger';

const externalRouter = express.Router();

// Apply API key validation to all routes
externalRouter.use(validateApiKey);

// ==================== USER'S OWN DATA ====================

/**
 * GET /api/v1/stats/overview
 * Get user's event statistics overview
 */
externalRouter.get('/stats/overview', requirePermission('read:analytics'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;

        const [
            totalEvents,
            activeEvents,
            totalRegistrations,
            totalRevenue
        ] = await Promise.all([
            Event.countDocuments({ hostId: ownerId }),
            Event.countDocuments({ hostId: ownerId, status: 'active' }),
            Ticket.countDocuments({
                eventId: { $in: await Event.find({ hostId: ownerId }).distinct('_id') },
                status: { $in: ['issued', 'checked-in'] }
            }),
            Payment.aggregate([
                {
                    $match: {
                        status: 'paid',
                        eventId: { $in: await Event.find({ hostId: ownerId }).distinct('_id') }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                events: {
                    total: totalEvents,
                    active: activeEvents
                },
                registrations: {
                    total: totalRegistrations
                },
                revenue: {
                    total: totalRevenue[0]?.total || 0,
                    currency: 'INR'
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.stats_overview', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/v1/stats/events
 * Get user's event statistics
 */
externalRouter.get('/stats/events', requirePermission('read:events'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case '90d': startDate.setDate(now.getDate() - 90); break;
            case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setDate(now.getDate() - 30);
        }

        const [eventStats, eventsByStatus, recentEvents] = await Promise.all([
            // Event counts by period
            Event.aggregate([
                { $match: { hostId: ownerId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Events by status
            Event.aggregate([
                { $match: { hostId: ownerId } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Recent events
            Event.find({ hostId: ownerId })
                .select('title status createdAt maxRegistrations')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
        ]);

        res.json({
            success: true,
            data: {
                period,
                daily: eventStats,
                byStatus: eventsByStatus.reduce((acc: any, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                recent: recentEvents.map((e: any) => ({
                    id: e._id,
                    title: e.title,
                    status: e.status,
                    capacity: e.maxRegistrations,
                    createdAt: e.createdAt
                }))
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.stats_events', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch event statistics' });
    }
});

/**
 * GET /api/v1/stats/registrations
 * Get user's registration statistics
 */
externalRouter.get('/stats/registrations', requirePermission('read:registrations'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;
        const { period = '30d' } = req.query;

        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case '90d': startDate.setDate(now.getDate() - 90); break;
            case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setDate(now.getDate() - 30);
        }

        // Get user's event IDs
        const userEventIds = await Event.find({ hostId: ownerId }).distinct('_id');

        const [dailyRegistrations, registrationsByStatus, topEvents] = await Promise.all([
            // Daily registrations
            Ticket.aggregate([
                { $match: { eventId: { $in: userEventIds }, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Registrations by status
            Ticket.aggregate([
                { $match: { eventId: { $in: userEventIds } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Top events by registrations
            Ticket.aggregate([
                { $match: { eventId: { $in: userEventIds }, createdAt: { $gte: startDate } } },
                { $group: { _id: '$eventId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'events',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'event'
                    }
                },
                { $unwind: '$event' },
                {
                    $project: {
                        eventId: '$_id',
                        eventTitle: '$event.title',
                        registrations: '$count'
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                period,
                daily: dailyRegistrations,
                byStatus: registrationsByStatus.reduce((acc: any, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                topEvents
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.stats_registrations', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch registration statistics' });
    }
});

// ==================== EVENTS ====================

/**
 * GET /api/v1/events
 * List user's events
 */
externalRouter.get('/events', requirePermission('read:events'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;
        const {
            status,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = Math.min(parseInt(limit as string) || 20, 100);
        const skip = (pageNum - 1) * limitNum;

        const query: any = { hostId: ownerId };
        if (status && status !== 'all') {
            query.status = status;
        }

        const [events, total] = await Promise.all([
            Event.find(query)
                .select('title description status date location maxRegistrations price createdAt slug')
                .sort({ [sortBy as string]: order === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Event.countDocuments(query)
        ]);

        // Get registration counts for each event
        const eventIds = events.map((e: any) => e._id);
        const regCounts = await Ticket.aggregate([
            { $match: { eventId: { $in: eventIds }, status: { $in: ['issued', 'checked-in'] } } },
            { $group: { _id: '$eventId', count: { $sum: 1 } } }
        ]);
        const regMap = regCounts.reduce((acc: any, r) => {
            acc[r._id.toString()] = r.count;
            return acc;
        }, {});

        res.json({
            success: true,
            data: events.map((e: any) => ({
                id: e._id,
                slug: e.slug,
                title: e.title,
                description: e.description,
                status: e.status,
                date: e.date,
                location: e.location,
                registrations: {
                    current: regMap[e._id.toString()] || 0,
                    max: e.maxRegistrations
                },
                price: e.price,
                createdAt: e.createdAt
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.list_events', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch events' });
    }
});

/**
 * GET /api/v1/events/:eventId
 * Get single event details (must be owned by user)
 */
externalRouter.get('/events/:eventId', requirePermission('read:events'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;
        const { eventId } = req.params;

        const event = await Event.findOne({ _id: eventId, hostId: ownerId })
            .select('-__v')
            .lean() as any;

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        // Get registration count
        const registrationCount = await Ticket.countDocuments({
            eventId,
            status: { $in: ['issued', 'checked-in'] }
        });
        const checkedInCount = await Ticket.countDocuments({ eventId, status: 'checked-in' });

        res.json({
            success: true,
            data: {
                id: event._id,
                slug: event.slug,
                title: event.title,
                description: event.description,
                status: event.status,
                date: event.date,
                location: event.location,
                registrations: {
                    total: registrationCount,
                    checkedIn: checkedInCount,
                    max: event.maxRegistrations
                },
                price: event.price,
                formSchema: event.formSchema,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.get_event', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch event' });
    }
});

/**
 * GET /api/v1/events/:eventId/registrations
 * Get registrations for a specific event (must be owned by user)
 */
externalRouter.get('/events/:eventId/registrations', requirePermission('read:registrations'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;
        const { eventId } = req.params;
        const { page = 1, limit = 50, status } = req.query;

        // Verify event ownership
        const event = await Event.findOne({ _id: eventId, hostId: ownerId });
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const pageNum = parseInt(page as string) || 1;
        const limitNum = Math.min(parseInt(limit as string) || 50, 100);
        const skip = (pageNum - 1) * limitNum;

        const query: any = { eventId };
        if (status) {
            query.status = status;
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .select('qrCodeHash status guestName guestEmail formData pricePaid paymentStatus createdAt checkedInAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Ticket.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: tickets.map((t: any) => ({
                id: t._id,
                ticketHash: t.qrCodeHash,
                status: t.status,
                attendee: {
                    name: t.guestName,
                    email: t.guestEmail
                },
                formData: t.formData,
                payment: {
                    amount: t.pricePaid,
                    status: t.paymentStatus
                },
                registeredAt: t.createdAt,
                checkedInAt: t.checkedInAt
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.event_registrations', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
    }
});

/**
 * GET /api/v1/events/:eventId/registrations/:ticketId
 * Get single registration details
 */
externalRouter.get('/events/:eventId/registrations/:ticketId', requirePermission('read:tickets'), async (req, res) => {
    try {
        const ownerId = req.apiKey.ownerId;
        const { eventId, ticketId } = req.params;

        // Verify event ownership
        const event = await Event.findOne({ _id: eventId, hostId: ownerId });
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const ticket = await Ticket.findOne({ _id: ticketId, eventId }).lean() as any;
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Registration not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: ticket._id,
                ticketHash: ticket.qrCodeHash,
                status: ticket.status,
                attendee: {
                    name: ticket.guestName,
                    email: ticket.guestEmail
                },
                formData: ticket.formData,
                payment: {
                    amount: ticket.pricePaid,
                    status: ticket.paymentStatus
                },
                registeredAt: ticket.createdAt,
                checkedInAt: ticket.checkedInAt,
                checkedInBy: ticket.checkedInBy
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('external_api.get_registration', { error: (error as Error).message });
        res.status(500).json({ success: false, error: 'Failed to fetch registration' });
    }
});

// ==================== API KEY INFO ====================

/**
 * GET /api/v1/me
 * Get current API key info
 */
externalRouter.get('/me', async (req, res) => {
    const apiKey = req.apiKey;

    res.json({
        success: true,
        data: {
            name: apiKey.name,
            keyPrefix: apiKey.keyPrefix,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit,
            usageCount: apiKey.usageCount,
            lastUsedAt: apiKey.lastUsedAt,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt
        },
        timestamp: new Date().toISOString()
    });
});

export default externalRouter;
