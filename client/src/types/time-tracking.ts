export type TimeRecord = {
    id: string;
    userId: string;
    clockInTime: string;
    clockOutTime?: string | null;
    duration?: number | null;
    date: string;
    notes?: string | null;
    user?: {
        id: string;
        name: string;
        avatar?: string;
    };
};

export type UseTimeTrackerOptions = {
    userId?: string;
    idleTimeoutMs?: number;
    onTimerChange?: () => void;
};
