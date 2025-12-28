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
    impersonateUser,
    getUserSessions,
    getUserLoginHistory,
    terminateSession,
    terminateAllUserSessions,
    getAllActiveSessions,
    getSystemSettings,
    updateSystemSettings,
    testSystemEmail,
    getSystemEmailAuthUrl,
    systemEmailCallback
} from '../controllers/adminController';

export const adminRouter = express.Router();

// OAuth callback - no auth required (user is redirected from Google)
adminRouter.get('/system-email/callback', systemEmailCallback);

// All other admin routes require Login AND Admin Role
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

// Session Management
adminRouter.get('/sessions', getAllActiveSessions);                    // All active sessions
adminRouter.get('/users/:userId/sessions', getUserSessions);           // Active sessions for user
adminRouter.get('/users/:userId/login-history', getUserLoginHistory);  // Full login history
adminRouter.delete('/sessions/:sessionId', terminateSession);          // Kill single session
adminRouter.delete('/users/:userId/sessions', terminateAllUserSessions); // Kill all user sessions

// System Settings
adminRouter.get('/settings', getSystemSettings);
adminRouter.patch('/settings', updateSystemSettings);
adminRouter.post('/settings/test-email', testSystemEmail);
adminRouter.get('/system-email/auth-url', getSystemEmailAuthUrl);      // Get Gmail OAuth URL
