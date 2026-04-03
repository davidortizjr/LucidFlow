
import { useDashboard } from "../../hooks/useApi";
import type { DashboardActivity } from "../../types";

export default function ActivityPanel() {
    const { activities, loading, error } = useDashboard();

    // Handle both array and paginated object formats
    const activitiesArray = Array.isArray(activities) ? activities : (activities as any)?.data || [];
    const typedActivities = activitiesArray as DashboardActivity[];

    if (loading) {
        return (
            <div className="bg-surface-container p-8 rounded-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-manrope text-xl font-bold">Recent Activity</h3>
                </div>
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-slate-400"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-400 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-400 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-surface-container p-8 rounded-2xl">
                <h3 className="font-manrope text-xl font-bold text-error">Error</h3>
                <p className="text-sm text-on-surface-variant mt-2">{error}</p>
            </div>
        );
    }

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'TASK_CREATED': return 'add_circle';
            case 'TASK_UPDATED': return 'edit';
            case 'MESSAGE_SENT': return 'chat';
            case 'USER_JOINED': return 'person_add';
            case 'PROJECT_CREATED': return 'folder_open';
            default: return 'info';
        }
    };

    return (
        <div className="bg-surface-container p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-manrope text-xl font-bold">Recent Activity</h3>
                <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-6">
                {typedActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden">
                                <img className="w-full h-full object-cover" src={activity.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} alt={activity.user?.name} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center border-2 border-surface-container">
                                <span className="material-symbols-outlined text-[10px]">{getActionIcon(activity.type)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface"><span className="font-bold">{activity.user?.name || 'Unknown'}</span> {activity.description}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {typedActivities.length === 0 && (
                    <p className="text-sm text-on-surface-variant">No activities yet</p>
                )}
            </div>
        </div>
    );
}
