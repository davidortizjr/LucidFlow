import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { buildApiUrl } from '../../config/runtimeEndpoints';

interface Notification {
    id: string;
    type: 'MESSAGE' | 'ACTIVITY';
    title: string;
    description: string;
    createdAt: string;
    isRead: boolean;
    metadata?: Record<string, unknown> | null;
}

export default function TopNavBar() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user || !token) {
            return;
        }

        try {
            const url = await buildApiUrl('/notifications?includeRead=false&limit=20');
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            const data = Array.isArray(payload?.data) ? payload.data : [];
            const unread = Number(payload?.meta?.unreadCount ?? payload?.unreadCount ?? 0);
            setNotifications(data);
            setUnreadCount(unread);
        } catch {
            // Ignore notification fetch errors to avoid breaking nav rendering.
        }
    }, [user, token]);

    useEffect(() => {
        void fetchNotifications();
        const intervalId = window.setInterval(() => {
            void fetchNotifications();
        }, 10000);

        return () => window.clearInterval(intervalId);
    }, [fetchNotifications]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'MESSAGE':
                return 'mail';
            case 'ACTIVITY':
                return 'event';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'MESSAGE':
                return 'text-blue-500 bg-blue-500/10';
            case 'ACTIVITY':
                return 'text-green-500 bg-green-500/10';
            default:
                return 'text-primary bg-primary/10';
        }
    };

    const formatTime = (dateValue: string) => {
        const date = new Date(dateValue);
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

    const markAsRead = async (id: string) => {
        if (!token) {
            return;
        }

        try {
            const url = await buildApiUrl(`/notifications/${id}/read`);
            await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } finally {
            setNotifications((previous) => previous.filter((notification) => notification.id !== id));
            setUnreadCount((previous) => Math.max(0, previous - 1));
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read and navigate
        await markAsRead(notification.id);
        setShowNotifications(false);

        // Navigate based on notification type
        const metadata = notification.metadata as Record<string, unknown> | null | undefined;

        if (notification.type === 'MESSAGE') {
            // Check if it's a channel message or direct message
            const channelId = metadata?.channelId as string;
            const senderId = metadata?.senderId as string;

            if (channelId) {
                // Channel message - navigate to messages (channel will be selected by ID if needed)
                navigate('/messages');
            } else if (senderId) {
                // Direct message - navigate to messages with the sender's user ID
                navigate(`/messages?directUser=${senderId}`);
            } else {
                navigate('/messages');
            }
        } else if (notification.type === 'ACTIVITY') {
            // Navigate to relevant activity page based on activity type
            const activityType = metadata?.type as string;
            const projectId = metadata?.projectId as string;

            if (activityType === 'USER_JOINED' || activityType === 'PROJECT_CREATED') {
                // Navigate to team for team activities
                navigate('/team');
            } else {
                // Default to dashboard for other activities
                navigate('/dashboard');
            }
        }
    };

    const markAllAsRead = async () => {
        if (!token) {
            return;
        }

        try {
            const url = await buildApiUrl('/notifications/read-all');
            await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } finally {
            setNotifications([]);
            setUnreadCount(0);
        }
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
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowSettings(false);
                            setShowUserMenu(false);
                        }}
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
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => void markAllAsRead()}
                                        className="mt-2 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Mark all as read
                                    </button>
                                )}
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
                                            onClick={() => void handleNotificationClick(notification)}
                                            className={`w-full px-4 py-3 border-b border-surface-container-highest dark:border-gray-700 hover:bg-surface-container-highest dark:hover:bg-gray-800 transition-colors text-left flex gap-3 ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/5' : ''
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                                <span className="material-symbols-outlined text-lg">{getNotificationIcon(notification.type)}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`text-sm font-semibold text-on-surface dark:text-white truncate ${!notification.isRead ? 'font-bold' : ''
                                                        }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1 line-clamp-2">
                                                    {notification.description}
                                                </p>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-500 mt-1.5">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Menu */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowSettings(!showSettings);
                            setShowNotifications(false);
                            setShowUserMenu(false);
                        }}
                        aria-label="Open settings menu"
                        title="Settings"
                        className="p-2 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-highest dark:hover:bg-surface-container-highest rounded-full transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </button>

                    {/* Settings Dropdown */}
                    {showSettings && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface-container dark:bg-surface-container rounded-lg shadow-lg overflow-hidden border border-surface-container-highest dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowSettings(false);
                                    navigate('/settings?section=notifications');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container-highest dark:hover:bg-gray-800 text-on-surface dark:text-white transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">notifications</span>
                                Notifications
                            </button>
                            <button
                                onClick={() => {
                                    setShowSettings(false);
                                    navigate('/settings?section=privacy');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container-highest dark:hover:bg-gray-800 text-on-surface dark:text-white transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">privacy_tip</span>
                                Privacy
                            </button>
                            <button
                                onClick={() => {
                                    setShowSettings(false);
                                    navigate('/settings?section=account');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container-highest dark:hover:bg-gray-800 text-on-surface dark:text-white transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">person</span>
                                Account
                            </button>
                            <button
                                onClick={() => {
                                    setShowSettings(false);
                                    navigate('/settings?section=appearance');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container-highest dark:hover:bg-gray-800 text-on-surface dark:text-white transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">palette</span>
                                Appearance
                            </button>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowUserMenu(!showUserMenu);
                            setShowNotifications(false);
                            setShowSettings(false);
                        }}
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
