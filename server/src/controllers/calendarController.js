import { sendError, sendSuccess } from '../helpers/response.js';
import { createCalendarEvent as createCalendarEventRecord, listCalendarEvents } from '../services/calendarService.js';

export async function getCalendarEvents(req, res, prisma) {
    try {
        const events = await listCalendarEvents(prisma);
        return sendSuccess(res, events);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function createCalendarEvent(req, res, prisma) {
    try {
        const event = await createCalendarEventRecord(prisma, req.body);
        return sendSuccess(res, event, { statusCode: 201 });
    } catch (error) {
        return sendError(res, error);
    }
}
