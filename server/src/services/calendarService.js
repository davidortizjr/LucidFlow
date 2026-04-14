import { HttpError } from '../helpers/response.js';

function parseDateTime(dateStr) {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }
    throw new HttpError(`Invalid date format: ${dateStr}`, 400, 'VALIDATION_ERROR');
}

export async function listCalendarEvents(prisma) {
    return prisma.calendarEvent.findMany({
        orderBy: { startTime: 'asc' }
    });
}

export async function createCalendarEvent(prisma, input) {
    const { title, description, startTime, endTime, location, attendeeIds } = input;

    if (!title || !startTime || !endTime) {
        throw new HttpError('Missing required fields: title, startTime, endTime', 400, 'VALIDATION_ERROR');
    }

    return prisma.calendarEvent.create({
        data: {
            title,
            description: description || null,
            startTime: parseDateTime(startTime),
            endTime: parseDateTime(endTime),
            location: location || null,
            attendeeIds: Array.isArray(attendeeIds) ? attendeeIds : []
        }
    });
}
