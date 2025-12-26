import express from 'express';
import { verifyToken } from '../middleware/auth';
import { verifyAdmin } from '../middleware/admin';
import {
    getSystemStats,
    runSystemHealthCheck,
    getServerLogs,
    clearServerLogs,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    impersonateUser
} from '../controllers/adminController';

export const adminRouter = express.Router();

// All admin routes require Login AND Admin Role
adminRouter.use(verifyToken, verifyAdmin);

adminRouter.get('/stats', getSystemStats);
adminRouter.get('/health', runSystemHealthCheck);
adminRouter.get('/logs', getServerLogs);
adminRouter.delete('/logs', clearServerLogs);

// User Management
adminRouter.get('/users', getAllUsers);
adminRouter.patch('/users/:userId/role', updateUserRole);
adminRouter.patch('/users/:userId/status', toggleUserStatus);
adminRouter.post('/users/:userId/impersonate', impersonateUser);

