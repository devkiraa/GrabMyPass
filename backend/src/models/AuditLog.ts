import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., 'IMPERSONATE', 'SUSPEND_USER', 'UPDATE_ROLE'
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
