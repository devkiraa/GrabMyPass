import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true }, // Reference to event registration
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who created the ticket

    subject: { type: String, required: true },
    category: {
        type: String,
        enum: ['payment', 'registration', 'ticket', 'general'],
        default: 'general'
    },
    description: { type: String, required: true },

    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    // Messages/conversation
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        senderType: { type: String, enum: ['user', 'host', 'admin'], required: true },
        message: { type: String, required: true },
        attachments: [{ type: String }], // URLs to uploaded files
        sentAt: { type: Date, default: Date.now }
    }],

    // Resolution
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolution: { type: String },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes
SupportTicketSchema.index({ userId: 1, status: 1 });
SupportTicketSchema.index({ eventId: 1, status: 1 });
SupportTicketSchema.index({ ticketId: 1 });

export const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);
