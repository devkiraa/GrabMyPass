import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['registration', 'check_in', 'event_update', 'coordinator_invite', 'system'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    data: { type: mongoose.Schema.Types.Mixed }, // Additional data
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
