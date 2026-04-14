import { HttpError, requireAuthUserId, sendError, sendSuccess } from '../helpers/response.js';
import {
    getUserNotifications,
    markAllNotificationsAsReadForUser,
    markNotificationAsReadForUser
} from '../services/notificationService.js';

export async function getNotifications(req, res, prisma) {
    try {
        const userId = requireAuthUserId(req);
        const includeRead = req.query.includeRead === 'true';
        const result = await getUserNotifications(prisma, {
            userId,
            includeRead,
            page: req.query.page,
            limit: req.query.limit
        });

        return sendSuccess(res, result.notifications, {
            meta: {
                unreadCount: result.unreadCount,
                pagination: result.pagination
            }
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function markNotificationAsRead(req, res, prisma) {
    try {
        const userId = requireAuthUserId(req);
        const { id } = req.params;

        const updated = await markNotificationAsReadForUser(prisma, {
            userId,
            notificationId: id
        });
        if (!updated) {
            throw new HttpError('Notification not found', 404, 'NOT_FOUND');
        }

        return sendSuccess(res, updated);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function markAllNotificationsAsRead(req, res, prisma) {
    try {
        const userId = requireAuthUserId(req);
        const updated = await markAllNotificationsAsReadForUser(prisma, userId);

        return sendSuccess(res, { updated });
    } catch (error) {
        return sendError(res, error);
    }
}
