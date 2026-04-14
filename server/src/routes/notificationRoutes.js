import express from 'express';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createNotificationRoutes(prisma) {
    const router = express.Router();

    router.get('/', authenticateToken, bindPrisma(getNotifications, prisma));
    router.patch('/read-all', authenticateToken, bindPrisma(markAllNotificationsAsRead, prisma));
    router.patch('/:id/read', authenticateToken, bindPrisma(markNotificationAsRead, prisma));

    return router;
}
