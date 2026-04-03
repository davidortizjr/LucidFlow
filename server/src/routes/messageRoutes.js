import express from 'express';
import { getMessages, createMessage, debugMessageCount } from '../controllers/messageController.js';

export function createMessageRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getMessages(req, res, prisma));
    router.post('/', (req, res) => createMessage(req, res, prisma));
    router.get('/debug/count', (req, res) => debugMessageCount(req, res, prisma));

    return router;
}
