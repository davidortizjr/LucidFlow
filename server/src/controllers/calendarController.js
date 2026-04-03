export async function getCalendarEvents(req, res, prisma) {
    try {
        const events = await prisma.calendarEvent.findMany({
            orderBy: { startTime: 'asc' }
        });
        res.json(events);
    } catch (error) {
        console.error('GET calendar events error:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function createCalendarEvent(req, res, prisma) {
    try {
        const { title, description, startTime, endTime, location, attendeeIds } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields: title, startTime, endTime' });
        }

        // Handle datetime-local format from HTML input (e.g., "2026-03-23T14:30")
        const parseDateTime = (dateStr) => {
            if (!dateStr) return null;
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
            throw new Error(`Invalid date format: ${dateStr}`);
        };

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description: description || null,
                startTime: parseDateTime(startTime),
                endTime: parseDateTime(endTime),
                location: location || null,
                attendeeIds: attendeeIds && Array.isArray(attendeeIds) ? attendeeIds : []
            }
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('POST calendar event error:', error);
        res.status(500).json({ error: error.message });
    }
}
