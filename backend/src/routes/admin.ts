import express from 'express';
import { verifyToken } from '../middleware/auth';
import { verifyAdmin } from '../middleware/admin';
import { getSystemStats, runSystemHealthCheck, getServerLogs, clearServerLogs } from '../controllers/adminController';

export const adminRouter = express.Router();

// All admin routes require Login AND Admin Role
adminRouter.use(verifyToken, verifyAdmin);

adminRouter.get('/stats', getSystemStats);
adminRouter.get('/health', runSystemHealthCheck);
adminRouter.get('/logs', getServerLogs);
adminRouter.delete('/logs', clearServerLogs);
