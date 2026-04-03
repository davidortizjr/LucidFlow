export type CalendarEvent = {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendeeIds?: string[];
    createdAt?: string;
};
