import { useMemo, useState } from "react";
import { useTimeTracker } from "../hooks/useTimeTracker";
import type { TimeRecord } from "../types";

const filters = [
    { value: "today", label: "Today" },
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
] as const;

type TimeFilter = (typeof filters)[number]["value"];

function minutesToLabel(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

function secondsToLabel(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function computeMinutes(record: TimeRecord) {
    if (typeof record.duration === "number") return record.duration;
    const inTime = new Date(record.clockInTime).getTime();
    const outTime = record.clockOutTime ? new Date(record.clockOutTime).getTime() : Date.now();
    return Math.max(0, Math.round((outTime - inTime) / 60000));
}

export default function TimeInOutPage() {
    const [selectedRange, setSelectedRange] = useState<TimeFilter>("today");

    // Ready for Electron later: hook includes optional IPC idle input if window.electron.ipcRenderer exists.
    const {
        records,
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
        refresh
    } = useTimeTracker({ userId: "user-1" });

    const typedRecords = records as TimeRecord[];
    const now = new Date();

    const filteredRecords = useMemo(() => {
        return typedRecords.filter((record) => {
            const recordDate = new Date(record.date);

            if (selectedRange === "today") {
                return recordDate.toDateString() === now.toDateString();
            }

            if (selectedRange === "this-week") {
                const start = new Date(now);
                start.setDate(now.getDate() - now.getDay());
                start.setHours(0, 0, 0, 0);

                const end = new Date(start);
                end.setDate(start.getDate() + 7);

                return recordDate >= start && recordDate < end;
            }

            return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
        });
    }, [now, selectedRange, typedRecords]);

    const weeklyTotalMinutes = useMemo(() => {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        return typedRecords
            .filter((record) => {
                const date = new Date(record.date);
                return date >= start && date < end;
            })
            .reduce((sum, record) => sum + computeMinutes(record), 0);
    }, [now, typedRecords]);

    const weeklyHours = weeklyTotalMinutes / 60;

    const statusLabel =
        status === "tracking"
            ? "Clocked In"
            : status === "idle"
                ? "Idle"
                : "Clocked Out";

    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="px-6 pb-12 pt-8">
                <header className="mb-8 mt-8">
                    <h2 className="font-manrope text-5xl font-extrabold text-on-surface tracking-tighter mb-2">Time Tracking</h2>
                    <p className="text-on-surface-variant max-w-lg leading-relaxed">
                        Real-time timer with autosave and server sync.
                    </p>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-72 rounded-2xl bg-surface-container-lowest animate-pulse" />
                        <div className="h-72 rounded-2xl bg-surface-container-lowest animate-pulse" />
                    </div>
                ) : error ? (
                    <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm">{error}</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-2xl p-8 text-on-primary">
                                <p className="text-on-primary/80 text-sm font-semibold uppercase tracking-wider">Current Status</p>
                                <h3 className="text-4xl font-extrabold font-manrope mt-2">{statusLabel}</h3>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    {activeRecord ? (
                                        <button
                                            type="button"
                                            onClick={() => void clockOut()}
                                            disabled={saving}
                                            className="px-5 py-2.5 rounded-lg bg-error-container text-on-error-container font-semibold disabled:opacity-60"
                                        >
                                            {saving ? "Saving..." : "Clock Out"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => void clockIn()}
                                            disabled={saving}
                                            className="px-5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-semibold disabled:opacity-60"
                                        >
                                            {saving ? "Saving..." : "Clock In"}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => void refresh()}
                                        className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-semibold"
                                    >
                                        Sync Now
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                    <div>
                                        <p className="text-on-primary/80 text-xs font-semibold uppercase tracking-wider">Clock In</p>
                                        <p className="text-lg font-semibold mt-1">
                                            {activeRecord ? new Date(activeRecord.clockInTime).toLocaleTimeString() : "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-on-primary/80 text-xs font-semibold uppercase tracking-wider">Server Sync</p>
                                        <p className="text-lg font-semibold mt-1">{lastSyncAt ? lastSyncAt.toLocaleTimeString() : "—"}</p>
                                    </div>
                                </div>

                                {isIdle && activeRecord && (
                                    <p className="mt-4 text-sm font-semibold text-amber-100">Idle detected. Timer remains active until clock out.</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant">
                                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Weekly Hours</p>
                                    <p className="text-3xl font-extrabold font-manrope text-on-surface">{weeklyHours.toFixed(1)}h</p>
                                </div>
                                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant">
                                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Live Timer</p>
                                    <p className="text-3xl font-extrabold font-manrope text-on-surface">{activeRecord ? secondsToLabel(elapsedSeconds) : "00:00:00"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-on-surface">Time Log</h3>
                                <select
                                    value={selectedRange}
                                    onChange={(event) => setSelectedRange(event.target.value as TimeFilter)}
                                    className="bg-surface-container text-on-surface rounded-lg px-3 py-2 text-sm font-semibold outline-none"
                                >
                                    {filters.map((filter) => (
                                        <option key={filter.value} value={filter.value}>
                                            {filter.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                {filteredRecords.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant">No records for this range.</p>
                                ) : (
                                    filteredRecords.map((record) => {
                                        const minutes = computeMinutes(record);
                                        const active = !record.clockOutTime;

                                        return (
                                            <div key={record.id} className="flex items-center justify-between p-4 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-surface-container-high"}`} />
                                                    <div>
                                                        <p className="font-semibold text-on-surface">{new Date(record.date).toLocaleDateString()}</p>
                                                        <p className="text-xs text-on-surface-variant mt-1">
                                                            {new Date(record.clockInTime).toLocaleTimeString()} - {record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString() : "Still working"}
                                                        </p>
                                                        <p className="text-xs text-on-surface-variant mt-1">{record.user?.name || "Unknown user"}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-on-surface">{minutesToLabel(minutes)}</p>
                                                    <p className={`text-xs mt-1 ${active ? "text-amber-600" : "text-emerald-600"}`}>
                                                        {active ? "In Progress" : "Completed"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}