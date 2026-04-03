import express from 'express';
import { getTimeRecords, createTimeRecord, updateTimeRecord } from '../controllers/timeTrackingController.js';

export function createTimeTrackingRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getTimeRecords(req, res, prisma));
    router.post('/', (req, res) => createTimeRecord(req, res, prisma));
    router.patch('/:id', (req, res) => updateTimeRecord(req, res, prisma));

    return router;
}
