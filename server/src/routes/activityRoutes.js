import express from 'express';
import { getActivities } from '../controllers/activityController.js';

export function createActivityRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getActivities(req, res, prisma));

    return router;
}
