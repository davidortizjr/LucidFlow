import express from 'express';
import { getCalendarEvents, createCalendarEvent } from '../controllers/calendarController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createCalendarRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getCalendarEvents, prisma));
    router.post('/', bindPrisma(createCalendarEvent, prisma));

    return router;
}
