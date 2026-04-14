import express from 'express';
import { getMessages, createMessage, debugMessageCount } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { bindPrisma, bindPrismaWithOptions } from '../helpers/routeBinding.js';

export function createMessageRoutes(prisma, options = {}) {
    const router = express.Router();
    const onMessageCreated = options.onMessageCreated;

    router.get('/', authenticateToken, bindPrisma(getMessages, prisma));
    router.post('/', authenticateToken, bindPrismaWithOptions(createMessage, prisma, { onMessageCreated }));
    router.get('/debug/count', authenticateToken, bindPrisma(debugMessageCount, prisma));

    return router;
}
