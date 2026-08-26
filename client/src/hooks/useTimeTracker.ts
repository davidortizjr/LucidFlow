import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimeRecord, UseTimeTrackerOptions } from "../types";
import { AUTOSAVE_INTERVAL_MS, SERVER_SYNC_INTERVAL_MS, IDLE_CHECK_INTERVAL_MS, DEFAULT_IDLE_TIMEOUT_MS } from "../constants/timing";
import { buildApiUrl } from "../config/runtimeEndpoints";

type TrackerStatus = "clocked-out" | "tracking" | "idle";

function computeDurationMinutes(record: TimeRecord, nowMs = Date.now()) {
    if (typeof record.duration === "number") return record.duration;
    const inTimeMs = new Date(record.clockInTime).getTime();
    const outTimeMs = record.clockOutTime ? new Date(record.clockOutTime).getTime() : nowMs;
    return Math.max(0, Math.round((outTimeMs - inTimeMs) / 60000));
}

function toClockDateString(value: Date) {
    return new Date(value).toISOString();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
}

async function fetchApiJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = await buildApiUrl(endpoint);
    return fetchJson<T>(url, init);
}

function unwrapApiData<T>(value: T): T {
    if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>).data as T;
    }

    return value;
}

export function useTimeTracker(options: UseTimeTrackerOptions = {}) {
    const { userId, idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS, onTimerChange } = options;

    const [records, setRecords] = useState<TimeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<TrackerStatus>("clocked-out");
    const [isIdle, setIsIdle] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

    const lastActivityAtRef = useRef(Date.now());

    const sortedRecords = useMemo(
        () => [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [records]
    );

    const activeRecord = useMemo(
        () => sortedRecords.find((record) => !record.clockOutTime),
        [sortedRecords]
    );

    const loadRecords = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (userId) query.set("userId", userId);
            const endpoint = query.toString() ? `/time-records?${query.toString()}` : "/time-records";
            const data = await fetchApiJson<TimeRecord[] | { data?: TimeRecord[] }>(endpoint);
            const recordsData = unwrapApiData(data);
            setRecords(Array.isArray(recordsData) ? recordsData : []);
            setError(null);
            setLastSyncAt(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load time records");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    useEffect(() => {
        if (!activeRecord) {
            setStatus("clocked-out");
            setElapsedSeconds(0);
            return;
        }

        setStatus(isIdle ? "idle" : "tracking");

        const updateElapsed = () => {
            const inMs = new Date(activeRecord.clockInTime).getTime();
            const deltaSec = Math.max(0, Math.floor((Date.now() - inMs) / 1000));
            setElapsedSeconds(deltaSec);
            onTimerChange?.();
        };

        updateElapsed();
        const intervalId = window.setInterval(updateElapsed, 1000);
        return () => window.clearInterval(intervalId);
    }, [activeRecord, isIdle, onTimerChange]);

    useEffect(() => {
        if (!activeRecord) return;

        const activityHandler = () => {
            lastActivityAtRef.current = Date.now();
            if (isIdle) {
                setIsIdle(false);
            }
        };

        const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "mousedown", "touchstart"];
        events.forEach((eventName) => window.addEventListener(eventName, activityHandler));

        const checkIdle = () => {
            const now = Date.now();
            const becameIdle = now - lastActivityAtRef.current >= idleTimeoutMs;
            setIsIdle(becameIdle);
        };

        const idleIntervalId = window.setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS);

        return () => {
            window.clearInterval(idleIntervalId);
            events.forEach((eventName) => window.removeEventListener(eventName, activityHandler));
        };
    }, [activeRecord, idleTimeoutMs, isIdle]);

    useEffect(() => {
        const maybeIpc = (window as any)?.electron?.ipcRenderer;
        if (!maybeIpc || typeof maybeIpc.on !== "function") return;

        const onUserActive = (_: unknown, active: boolean) => {
            setIsIdle(!active);
            if (active) {
                lastActivityAtRef.current = Date.now();
            }
        };

        maybeIpc.on("user:active", onUserActive);

        return () => {
            if (typeof maybeIpc.off === "function") {
                maybeIpc.off("user:active", onUserActive);
            } else if (typeof maybeIpc.removeListener === "function") {
                maybeIpc.removeListener("user:active", onUserActive);
            }
        };
    }, []);

    useEffect(() => {
        if (!activeRecord || status === "clocked-out") return;

        const autosaveId = window.setInterval(async () => {
            try {
                const minutes = computeDurationMinutes(activeRecord);
                await fetchApiJson<TimeRecord>(`/time-records/${activeRecord.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ duration: minutes })
                });
            } catch {
                // silent autosave failure; periodic sync still runs
            }
        }, AUTOSAVE_INTERVAL_MS);

        return () => window.clearInterval(autosaveId);
    }, [activeRecord, status]);

    useEffect(() => {
        const syncId = window.setInterval(() => {
            void loadRecords();
        }, SERVER_SYNC_INTERVAL_MS);

        return () => window.clearInterval(syncId);
    }, [loadRecords]);

    const clockIn = useCallback(async () => {
        if (!userId || activeRecord || saving) return;

        setSaving(true);
        try {
            const now = new Date();
            const created = await fetchApiJson<TimeRecord>("/time-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    date: toClockDateString(now),
                    clockInTime: toClockDateString(now),
                    notes: null
                })
            });

            const createdRecord = unwrapApiData(created);

            setRecords((prev) => [createdRecord, ...prev]);
            setStatus("tracking");
            setError(null);
            lastActivityAtRef.current = Date.now();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Clock in failed");
        } finally {
            setSaving(false);
        }
    }, [activeRecord, saving, userId]);

    const clockOut = useCallback(async () => {
        if (!activeRecord || saving) return;

        setSaving(true);
        try {
            const clockOutTime = new Date();
            const duration = computeDurationMinutes(activeRecord, clockOutTime.getTime());

            const updated = await fetchApiJson<TimeRecord>(`/time-records/${activeRecord.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clockOutTime: toClockDateString(clockOutTime),
                    duration
                })
            });

            const updatedRecord = unwrapApiData(updated);

            setRecords((prev) => prev.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)));
            setStatus("clocked-out");
            setIsIdle(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Clock out failed");
        } finally {
            setSaving(false);
        }
    }, [activeRecord, saving]);

    return {
        records: sortedRecords,
        activeRecord,
        loading,
        saving,
        error,
        status,
        isIdle,
        elapsedSeconds,
        lastSyncAt,
        clockIn,
        clockOut,
        refresh: loadRecords
    };
}
