import express from 'express';
import { getChannels, getChannelById } from '../controllers/channelController.js';

export function createChannelRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getChannels(req, res, prisma));
    router.get('/:id', (req, res) => getChannelById(req, res, prisma));

    return router;
}
