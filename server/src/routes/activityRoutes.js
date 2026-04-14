import express from 'express';
import { getActivities } from '../controllers/activityController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createActivityRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getActivities, prisma));

    return router;
}
