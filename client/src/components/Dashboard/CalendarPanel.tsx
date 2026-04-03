import { useState } from 'react';
import { useDashboard } from '../../hooks/useApi';
import type { DashboardEvent } from '../../types';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPanel() {
    const { events, loading, error } = useDashboard();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Handle both array and paginated object formats
    const eventsArray = Array.isArray(events) ? events : (events as any)?.data || [];
    const typedEvents = eventsArray as DashboardEvent[];

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const getDaysArray = () => {
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const getEventsForDay = (day: number) => {
        if (!day) return [];
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return typedEvents.filter(e => {
            const eventDate = new Date(e.startTime);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    const isCurrentDay = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const getCellClassName = (day: number | null) => {
        if (day === null) {
            return 'h-28 p-2 text-sm bg-surface-container-lowest text-on-surface-variant/40';
        }

        if (isCurrentDay(day)) {
            return 'h-28 p-2 text-sm bg-indigo-50/30 ring-2 ring-primary ring-inset z-10 text-on-surface font-bold';
        }

        return 'h-28 p-2 text-sm bg-surface-container-lowest text-on-surface';
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8 animate-pulse">
                <div className="h-8 bg-slate-400 rounded w-1/4 mb-8"></div>
                <div className="grid grid-cols-7 gap-2 h-64">
                    {[...Array(42)].map((_, i) => <div key={i} className="bg-slate-300 rounded"></div>)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8">
                <p className="text-error">Error loading calendar: {error}</p>
            </div>
        );
    }

    const days = getDaysArray();
    const todayEvents = typedEvents.filter(e => {
        const eventDate = new Date(e.startTime);
        const today = new Date();
        return eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear();
    });

    return (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-manrope text-2xl font-extrabold text-on-surface">{monthName}</h3>
                    <p className="text-sm text-on-surface-variant">{todayEvents.length} event/s scheduled for today</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-surface-container rounded-full"><span className="material-symbols-outlined">chevron_left</span></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-surface-container rounded-full"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-outline-variant/20 rounded-lg overflow-hidden border border-outline-variant/10">
                {/* Day Headers */}
                {DAY_HEADERS.map(day => (
                    <div key={day} className="bg-primary/10 dark:bg-primary/20 py-3 text-center text-xs font-bold uppercase tracking-widest text-primary dark:text-blue-300">
                        {day}
                    </div>
                ))}

                {/* Calendar Days */}
                {days.map((day, idx) => {
                    const dayEvents = day ? getEventsForDay(day) : [];

                    return (
                        <div key={idx} className={getCellClassName(day)}>
                            {day && (
                                <>
                                    <div>{day}</div>
                                    <div className="mt-2 space-y-1">
                                        {dayEvents.slice(0, 2).map((event) => (
                                            <div key={event.id} className="p-1.5 bg-primary/20 text-primary rounded-md border-l-2 border-primary">
                                                <p className="text-[9px] font-bold truncate uppercase">{event.title}</p>
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <p className="text-[8px] text-on-surface-variant font-bold">+{dayEvents.length - 2} more</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
