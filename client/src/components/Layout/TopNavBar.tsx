import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface Notification {
    id: string;
    type: 'message' | 'mention' | 'event' | 'ticket';
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
    avatar?: string;
}

export default function TopNavBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Sample notifications data
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'message',
            title: 'Sarah Johnson',
            description: 'Hey, did you get the latest project files?',
            timestamp: new Date(Date.now() - 5 * 60000),
            read: false,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPxbIJdJg_ogrbR6ZBk6QlBbaE91rHVpSfytGLtWKdu5IqDhMv5hn4opb5c1Y'
        },
        {
            id: '2',
            type: 'mention',
            title: 'Mentioned in #design',
            description: '@you check out the new design system components',
            timestamp: new Date(Date.now() - 15 * 60000),
            read: false,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAshIyC8D'
        },
        {
            id: '3',
            type: 'event',
            title: 'Added to Team Standup',
            description: 'You were added as an attendee to the meeting',
            timestamp: new Date(Date.now() - 30 * 60000),
            read: false,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAshIyC8D'
        },
        {
            id: '4',
            type: 'ticket',
            title: 'Assigned to TICKET-234',
            description: 'Fix navigation menu responsiveness on mobile',
            timestamp: new Date(Date.now() - 2 * 3600000),
            read: true,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPxbIJdJg_ogrbR6ZBk6QlBbaE91rHVpSfytGLtWKdu5IqDhMv5hn4opb5c1Y'
        },
        {
            id: '5',
            type: 'message',
            title: 'Mike Chen',
            description: 'Looking good! Ready for the demo tomorrow',
            timestamp: new Date(Date.now() - 3 * 3600000),
            read: true,
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPxbIJdJg_ogrbR6ZBk6QlBbaE91rHVpSfytGLtWKdu5IqDhMv5hn4opb5c1Y'
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message':
                return 'mail';
            case 'mention':
                return 'at';
            case 'event':
                return 'event';
            case 'ticket':
                return 'assignment';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'message':
                return 'text-blue-500 bg-blue-500/10';
            case 'mention':
                return 'text-purple-500 bg-purple-500/10';
            case 'event':
                return 'text-green-500 bg-green-500/10';
            case 'ticket':
                return 'text-orange-500 bg-orange-500/10';
            default:
                return 'text-primary bg-primary/10';
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="fixed w-full z-40 bg-surface-container dark:bg-surface-container backdrop-blur-md flex justify-between items-center h-16 px-6 md:pl-72 top-12">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-on-surface dark:text-white tracking-tighter md:hidden">
                    Architectural Workspace
                </span>
                <div className="hidden md:flex bg-surface-container dark:bg-surface-container rounded-full px-4 py-1.5 items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-gray-400 text-lg">
                        search
                    </span>
                    <input
                        className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant dark:placeholder-gray-500 dark:text-white"
                        placeholder="Search workspace..."
                        type="text"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Notifications Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-highest dark:hover:bg-surface-container-highest rounded-full transition-colors active:scale-95 relative"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-96 bg-surface-container dark:bg-surface-container rounded-2xl shadow-2xl overflow-hidden border border-surface-container-highest dark:border-gray-700">
                            {/* Header */}
                            <div className="p-4 border-b border-surface-container-highest dark:border-gray-700 bg-surface-container-lowest dark:bg-surface-container-lowest">
                                <h3 className="font-bold text-on-surface dark:text-white">Notifications</h3>
                                <p className="text-xs text-on-surface-variant dark:text-gray-400">{unreadCount} unread</p>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-on-surface-variant dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">notifications_none</span>
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <button
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`w-full px-4 py-3 border-b border-surface-container-highest dark:border-gray-700 hover:bg-surface-container-highest dark:hover:bg-gray-800 transition-colors text-left flex gap-3 ${!notification.read ? 'bg-primary/5 dark:bg-primary/5' : ''
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                                <span className="material-symbols-outlined text-lg">{getNotificationIcon(notification.type)}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`text-sm font-semibold text-on-surface dark:text-white truncate ${!notification.read ? 'font-bold' : ''
                                                        }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1 line-clamp-2">
                                                    {notification.description}
                                                </p>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-500 mt-1.5">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <button className="w-full p-3 text-center text-primary dark:text-blue-400 hover:bg-surface-container-highest dark:hover:bg-gray-800 text-sm font-semibold transition-colors border-t border-surface-container-highest dark:border-gray-700">
                                    View All Notifications
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <button className="p-2 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-highest dark:hover:bg-surface-container-highest rounded-full transition-colors active:scale-95">
                    <span className="material-symbols-outlined">settings</span>
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 hover:bg-surface-container-highest dark:hover:bg-surface-container-highest rounded-full p-1 transition-colors active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-surface-container-high overflow-hidden ring-2 ring-surface dark:ring-surface-container">
                            <img
                                alt="User profile avatar"
                                className="w-full h-full object-cover"
                                src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAPxbIJdJg_ogrbR6ZBk6QlBbaE91rHVpSfytGLtWKdu5IqDhMv5hn4opb5c1Y_-lBsKwxmy-3PFRkU-p3WopMEljc2cT0CjgcUJALMddQVnKfS5bGzgUr2VUw0nquQgkH7HLOqSVrCtcpuYN_hFJDvA14L4ZEGz7aMYg5zxSkbhwl6Z7ECyYudjRxWQV3nY_LNMkTjdsSDUUJpnEzE2zSJgn5ikUnkCyWhJ7B8JmQxtuQhK2KnF6zEieleGEUejCbPAkfBKGAlwTw"}
                            />
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface-container dark:bg-surface-container rounded-lg shadow-lg overflow-hidden">
                            <div className="p-4 border-b border-surface-container-lowest dark:border-gray-700">
                                <p className="font-semibold text-on-surface dark:text-white">{user?.name}</p>
                                <p className="text-sm text-on-surface-variant dark:text-gray-400">{user?.email}</p>
                                <p className="text-xs text-on-surface-variant dark:text-gray-500 mt-1 capitalize">{user?.role.toLowerCase()}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container-highest dark:hover:bg-gray-800 text-on-surface dark:text-white transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
