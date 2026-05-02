import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCalendarEvents } from "../hooks/useApi";
import CreateEventModal from "../components/Dashboard/CreateEventModal";
import type { CalendarEvent } from "../types";

const palette = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500", "bg-rose-500", "bg-primary"];

export default function CalendarPage() {
    const [searchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showCreateModal, setShowCreateModal] = useState(searchParams.get("modal") === "create-event");
    const { events, loading, error, refetch } = useCalendarEvents();
    const typedEvents = events as CalendarEvent[];

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    const days = Array.from({ length: 42 }, (_, index) => {
        const dayNum = index - firstDayOfMonth(currentDate) + 1;
        return dayNum <= 0 || dayNum > daysInMonth(currentDate) ? null : dayNum;
    });

    const eventsWithColors = useMemo(
        () =>
            typedEvents.map((event, index) => ({
                ...event,
                color: palette[index % palette.length],
            })),
        [typedEvents]
    );

    const getDayEvents = (day: number) => {
        if (!day) return [];

        return eventsWithColors.filter((event) => {
            const eventDate = new Date(event.startTime);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const upcomingEvents = eventsWithColors
        .filter((event) => new Date(event.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 8);

    const todayEvents = eventsWithColors.filter((event) => {
        const eventDate = new Date(event.startTime);
        const today = new Date();
        return (
            eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear()
        );
    });

    return (
        <>
            <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
                <div className="px-4 md:px-6 pb-8 pt-6">
                    <header className="mb-6 mt-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                            <div>
                                <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter mb-1">Calendar</h2>
                                <p className="text-sm md:text-base text-on-surface-variant max-w-lg leading-relaxed">Manage your schedule and view upcoming team events.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Create Event
                            </button>
                        </div>
                    </header>

                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 h-[480px] rounded-2xl bg-surface-container-lowest animate-pulse" />
                            <div className="h-[480px] rounded-2xl bg-surface-container-lowest animate-pulse" />
                        </div>
                    ) : error ? (
                        <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm">{error}</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-4 md:p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl md:text-2xl font-extrabold font-manrope text-on-surface">{monthName}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center hover:bg-surface-container rounded-lg transition-colors">
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center hover:bg-surface-container rounded-lg transition-colors">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1.5 mb-2">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                        <div key={day} className="h-8 flex items-center justify-center text-[11px] font-semibold text-on-surface-variant">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1.5">
                                    {days.map((day, index) => {
                                        const dayEvents = day ? getDayEvents(day) : [];
                                        const today = new Date();
                                        const isToday =
                                            day === today.getDate() &&
                                            currentDate.getMonth() === today.getMonth() &&
                                            currentDate.getFullYear() === today.getFullYear();

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-24 p-1.5 rounded-lg border transition-all ${day
                                                    ? isToday
                                                        ? "bg-primary-fixed border-primary ring-1 ring-primary"
                                                        : "bg-surface-container border-outline-variant hover:bg-surface-container-high"
                                                    : "bg-transparent border-transparent"
                                                    }`}
                                            >
                                                {day && (
                                                    <>
                                                        <div className={`text-xs md:text-sm font-semibold mb-1 ${isToday ? "text-primary" : "text-on-surface"}`}>{day}</div>
                                                        <div className="space-y-0.5">
                                                            {dayEvents.slice(0, 2).map((event) => (
                                                                <div key={event.id} className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded text-white truncate ${event.color}`}>
                                                                    {event.title}
                                                                </div>
                                                            ))}
                                                            {dayEvents.length > 2 && (
                                                                <div className="text-[10px] md:text-xs px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">+{dayEvents.length - 2} more</div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="lg:col-span-1 space-y-3">
                                <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-5">
                                    <h3 className="text-base md:text-lg font-semibold text-on-surface mb-3">Upcoming Events</h3>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {upcomingEvents.length === 0 ? (
                                            <p className="text-sm text-on-surface-variant">No upcoming events.</p>
                                        ) : (
                                            upcomingEvents.map((event) => (
                                                <div key={event.id} className="p-3 bg-surface-container rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${event.color}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-on-surface text-sm">{event.title}</h4>
                                                            <p className="text-xs text-on-surface-variant mt-1">{new Date(event.startTime).toLocaleString()}</p>
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <span className="material-symbols-outlined text-sm text-on-surface-variant">group</span>
                                                                <span className="text-xs text-on-surface-variant">{event.attendeeIds?.length || 0} attendees</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-4 md:p-5 text-on-primary">
                                    <h4 className="font-semibold mb-2">Today's Summary</h4>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span>Total Events:</span>
                                            <span className="font-semibold">{todayEvents.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Total Attendees:</span>
                                            <span className="font-semibold">{todayEvents.reduce((sum, event) => sum + (event.attendeeIds?.length || 0), 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-on-primary/20">
                                            <span>Next Event:</span>
                                            <span className="font-semibold">{upcomingEvents[0] ? new Date(upcomingEvents[0].startTime).toLocaleString() : "None"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Event Modal */}
            {
                showCreateModal && (
                    <CreateEventModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onEventCreated={refetch}
                    />
                )
            }
        </>
    );
}
