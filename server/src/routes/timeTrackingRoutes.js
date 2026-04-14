import express from 'express';
import { getTimeRecords, createTimeRecord, updateTimeRecord } from '../controllers/timeTrackingController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createTimeTrackingRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getTimeRecords, prisma));
    router.post('/', bindPrisma(createTimeRecord, prisma));
    router.patch('/:id', bindPrisma(updateTimeRecord, prisma));

    return router;
}
