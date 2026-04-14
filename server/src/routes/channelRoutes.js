import express from 'express';
import { getChannels, getChannelById } from '../controllers/channelController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createChannelRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getChannels, prisma));
    router.get('/:id', bindPrisma(getChannelById, prisma));

    return router;
}
