
import { useDashboard } from "../../hooks/useApi";
import type { DashboardProject, DashboardUser, DashboardEvent } from "../../types";

export default function StatsPanel() {
    const { projects, users, events, loading, error } = useDashboard();

    // Handle both array and paginated object formats
    const projectsArray = Array.isArray(projects) ? projects : (projects as any)?.data || [];
    const usersArray = Array.isArray(users) ? users : (users as any)?.data || [];
    const eventsArray = Array.isArray(events) ? events : (events as any)?.data || [];

    const typedProjects = projectsArray as DashboardProject[];
    const typedUsers = usersArray as DashboardUser[];
    const typedEvents = eventsArray as DashboardEvent[];

    const activeProjects = typedProjects.filter((project) => project.status === 'active').length;

    if (loading) {
        return (
            <div className="md:col-span-4 space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm animate-pulse">
                        <div className="h-4 bg-slate-400 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-slate-400 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="md:col-span-4 bg-surface-container-lowest p-6 rounded-xl">
                <p className="text-error">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="md:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm border-l-4 border-primary">
                <p className="text-xs font-bold text-on-secondary-fixed-variant dark:text-blue-200 uppercase tracking-widest mb-4">Active Projects</p>
                <div className="flex items-end justify-between">
                    <span className="text-4xl font-manrope font-black text-on-surface dark:text-white">{activeProjects}</span>
                    <div className="flex -space-x-2">
                        {typedUsers.slice(0, 3).map((user) => (
                            <div key={user.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 bg-slate-300 dark:bg-slate-600 overflow-hidden">
                                <img className="w-full h-full object-cover" src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} alt={user.name} />
                            </div>
                        ))}
                        {typedUsers.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-gray-300">+{typedUsers.length - 3}</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-on-secondary-fixed-variant dark:text-blue-200 uppercase tracking-widest mb-4">Total Tasks</p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-manrope font-black text-on-surface dark:text-white">{typedProjects.reduce((sum, project) => sum + ((project as any)?._count?.tasks || 0), 0)}</span>
                    <span className="text-tertiary dark:text-green-400 font-bold text-sm mb-1 flex items-center">
                        <span className="material-symbols-outlined text-sm">task</span> Tasks
                    </span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-surface-container-low dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-container" style={{ width: "75%" }}></div>
                </div>
            </div>
            <div className="bg-surface-container-low dark:bg-surface-container p-6 rounded-xl">
                <h3 className="font-manrope font-bold text-on-surface dark:text-white mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                    {typedEvents
                        .filter((event) => new Date(event.startTime) > new Date())
                        .slice(0, 5)
                        .map((event) => {
                            const eventDate = new Date(event.startTime);
                            return (
                                <div key={event.id} className="flex gap-3 p-3 bg-surface-container dark:bg-surface-container-highest rounded-lg hover:bg-surface-container-high dark:hover:bg-gray-700 transition">
                                    <div className="w-12 h-12 rounded-md bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-primary dark:text-blue-300">calendar_today</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-on-surface dark:text-white truncate">{event.title}</p>
                                        <p className="text-xs text-on-surface-variant dark:text-gray-400">{eventDate.toLocaleString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
