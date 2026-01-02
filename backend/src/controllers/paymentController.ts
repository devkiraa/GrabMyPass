import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { Event } from '../models/Event';
import { logger } from '../lib/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for payment screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'payment-proofs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
});

// Upload payment proof screenshot
export const uploadPaymentProof = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { utr, amount } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Payment screenshot is required' });
        }

        const ticket = await Ticket.findById(ticketId).populate('eventId');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const event = ticket.eventId as any;
        if (!event.paymentConfig?.enabled) {
            return res.status(400).json({ message: 'Payment proof not required for this event' });
        }

        // Store payment proof info
        const screenshotUrl = `/uploads/payment-proofs/${req.file.filename}`;

        ticket.paymentProof = {
            screenshotUrl,
            utr: utr || '',
            amount: parseFloat(amount) || ticket.pricePaid,
            uploadedAt: new Date(),
            verificationStatus: 'pending',
            verificationMethod: 'none',
            autoVerifyResponse: {}
        };

        await ticket.save();

        logger.info('payment.proof_uploaded', {
            ticketId,
            utr,
            amount
        });

        res.json({
            message: 'Payment proof uploaded successfully',
            ticket,
            screenshotUrl
        });
    } catch (error: any) {
        logger.error('payment.upload_failed', { error: error.message }, error);
        res.status(500).json({ message: 'Failed to upload payment proof', error: error.message });
    }
};

// Get pending payment verifications (for admin/host)
export const getPendingPayments = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        // @ts-ignore
        const userRole = req.user?.role;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        let query: any = {
            'paymentProof.verificationStatus': 'pending'
        };

        // If not admin, only show their own events
        if (userRole !== 'admin') {
            const hostEvents = await Event.find({ hostId: userId }).select('_id');
            const eventIds = hostEvents.map(e => e._id);
            query.eventId = { $in: eventIds };
        }

        const tickets = await Ticket.find(query)
            .populate('eventId', 'title slug hostId price')
            .populate('userId', 'name email')
            .sort({ 'paymentProof.uploadedAt': -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Check for duplicate UTRs across all tickets
        const utrs = tickets.map(t => t.paymentProof?.utr).filter(Boolean);
        const duplicateChecks = await Ticket.find({
            'paymentProof.utr': { $in: utrs },
            'paymentProof.verificationStatus': { $in: ['pending', 'verified'] }
        }).select('paymentProof.utr _id');

        const utrCounts: Record<string, number> = {};
        duplicateChecks.forEach(t => {
            const utr = t.paymentProof.utr;
            utrCounts[utr] = (utrCounts[utr] || 0) + 1;
        });

        const paymentsWithFlags = tickets.map(t => ({
            ...t,
            isDuplicateUtr: utrCounts[t.paymentProof?.utr] > 1
        }));

        const total = await Ticket.countDocuments(query);

        res.json({
            payments: paymentsWithFlags,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        logger.error('payment.get_pending_failed', { error: error.message }, error);
        res.status(500).json({ message: 'Failed to fetch pending payments' });
    }
};

// Manual verification (approve/reject)
export const verifyPaymentManual = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { status, rejectionReason } = req.body; // status: 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid verification status' });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (!ticket.paymentProof) {
            return res.status(400).json({ message: 'No payment proof to verify' });
        }

        ticket.paymentProof.verificationStatus = status as any;
        ticket.paymentProof.verifiedAt = new Date();
        // @ts-ignore
        ticket.paymentProof.verifiedBy = req.user.id;
        ticket.paymentProof.verificationMethod = 'manual';

        if (status === 'rejected' && rejectionReason) {
            ticket.paymentProof.rejectionReason = rejectionReason;
            ticket.status = 'pending'; // Keep ticket pending if payment rejected
        } else if (status === 'verified') {
            ticket.status = 'issued'; // Issue ticket on verification
            ticket.paymentStatus = 'completed';
        }

        await ticket.save();

        logger.info('payment.manual_verify', {
            ticketId,
            status,
            // @ts-ignore
            verifiedBy: req.user.id
        });

        res.json({
            message: `Payment ${status} successfully`,
            ticket
        });
    } catch (error: any) {
        logger.error('payment.verify_failed', { error: error.message }, error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

// Auto-verify using Cloudflare Worker
export const verifyPaymentAuto = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { statementText, date } = req.body; // Bank statement text extracted from PDF

        const ticket = await Ticket.findById(ticketId).populate('eventId');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (!ticket.paymentProof?.utr) {
            return res.status(400).json({ message: 'UTR not provided in payment proof' });
        }

        // Call Cloudflare Worker
        const workerUrl = 'https://upi-statement-verifier.devkiraa.workers.dev/';
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                utr: ticket.paymentProof.utr,
                amount: ticket.paymentProof.amount,
                date,
                statementText
            })
        });

        const result = await response.json();

        // Store the verification response
        ticket.paymentProof.autoVerifyResponse = result;

        // Update verification status based on result
        if (result.status === 'VERIFIED') {
            ticket.paymentProof.verificationStatus = 'verified';
            ticket.paymentProof.verifiedAt = new Date();
            // @ts-ignore
            ticket.paymentProof.verifiedBy = req.user.id;
            ticket.paymentProof.verificationMethod = 'auto';
            ticket.status = 'issued';
            ticket.paymentStatus = 'completed';
        } else if (result.status === 'NOT_FOUND') {
            ticket.paymentProof.verificationStatus = 'rejected';
            ticket.paymentProof.rejectionReason = 'UTR not found in statement';
            // @ts-ignore
            ticket.paymentProof.verifiedBy = req.user.id;
            ticket.paymentProof.verificationMethod = 'auto';
        } else {
            // NEEDS_MANUAL_REVIEW
            ticket.paymentProof.verificationStatus = 'pending';
            ticket.paymentProof.verificationMethod = 'none';
        }

        await ticket.save();

        logger.info('payment.auto_verify', {
            ticketId,
            status: result.status,
            // @ts-ignore
            verifiedBy: req.user.id
        });

        res.json({
            message: 'Auto-verification completed',
            result,
            ticket
        });
    } catch (error: any) {
        logger.error('payment.auto_verify_failed', { error: error.message }, error);
        res.status(500).json({ message: 'Auto-verification failed', error: error.message });
    }
};
