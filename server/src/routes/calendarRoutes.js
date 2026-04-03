import express from 'express';
import { getCalendarEvents, createCalendarEvent } from '../controllers/calendarController.js';

export function createCalendarRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getCalendarEvents(req, res, prisma));
    router.post('/', (req, res) => createCalendarEvent(req, res, prisma));

    return router;
}
