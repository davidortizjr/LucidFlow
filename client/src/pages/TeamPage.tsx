import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeamDirectory } from "../hooks/useApi";
import type { TeamUser, StatusStyle } from "../types";

const STATUS_STYLE_MAP: Record<string, StatusStyle> = {
    online: {
        dotBgClass: "bg-emerald-500",
        textClass: "text-emerald-600",
        label: "Online",
    },
    away: {
        dotBgClass: "bg-amber-500",
        textClass: "text-amber-600",
        label: "Away",
    },
    offline: {
        dotBgClass: "bg-slate-400",
        textClass: "text-slate-500",
        label: "Offline",
    },
};

const DEFAULT_STATUS_STYLE: StatusStyle = {
    dotBgClass: "bg-slate-400",
    textClass: "text-slate-500",
    label: "Unknown",
};

const skeletonCards = Array.from({ length: 6 }, (_, index) => index + 1);

function TeamPageShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="px-6 pb-12 pt-8">{children}</div>
        </main>
    );
}

function UserProfileModal({ user, isOpen, onClose }: { user: TeamUser | null; isOpen: boolean; onClose: () => void }) {
    if (!isOpen || !user) return null;

    const normalizedStatus = user.status?.toLowerCase() ?? "";
    const statusStyle = STATUS_STYLE_MAP[normalizedStatus] ?? {
        ...DEFAULT_STATUS_STYLE,
        label: user.status || DEFAULT_STATUS_STYLE.label,
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 ring-1 ring-outline-variant/20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-on-surface">Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/20">
                                <img
                                    className="w-full h-full object-cover"
                                    alt={user.name}
                                    src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                                />
                            </div>
                            <div
                                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-surface-container-lowest ${statusStyle.dotBgClass}`}
                                title={statusStyle.label}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-on-surface mb-1">{user.name}</h3>
                        <p className="text-sm text-on-surface-variant">{user.email}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-surface-container rounded-lg p-4">
                            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-1">Role</p>
                            <p className="text-sm font-semibold text-on-surface">{user.role}</p>
                        </div>

                        <div className="bg-surface-container rounded-lg p-4">
                            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-2">Status</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.dotBgClass}`} />
                                <span className="text-sm font-medium text-on-surface">{statusStyle.label}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all active:scale-95"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

const UserCard = memo(function UserCard({ user }: { user: TeamUser }) {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const normalizedStatus = user.status?.toLowerCase() ?? "";
    const statusStyle = STATUS_STYLE_MAP[normalizedStatus] ?? {
        ...DEFAULT_STATUS_STYLE,
        label: user.status || DEFAULT_STATUS_STYLE.label,
    };

    const handleMessage = () => {
        navigate(`/messages?directUser=${user.id}`);
    };

    return (
        <>
            <div className="group bg-surface-container-lowest rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 ring-1 ring-inset ring-outline-variant/10">
                <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-surface-container-low transition-transform group-hover:scale-105 duration-500">
                            <img
                                className="w-full h-full object-cover"
                                alt={user.name}
                                src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                            />
                        </div>
                        <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-surface-container-lowest ${statusStyle.dotBgClass}`}
                            title={statusStyle.label}
                        />
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">
                            {user.role}
                        </span>
                        <span className={`text-xs font-medium mt-2 flex items-center gap-1 ${statusStyle.textClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotBgClass}`} />
                            {statusStyle.label}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold font-manrope text-on-surface">{user.name}</h3>
                    <p className="text-sm text-on-surface-variant mb-6">{user.email}</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleMessage}
                        className="flex-1 bg-gradient-to-r from-primary to-primary-container text-white py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all hover:shadow-lg hover:shadow-primary/50"
                    >
                        Message
                    </button>
                    <button
                        onClick={() => setShowProfile(true)}
                        className="px-3 py-2.5 bg-surface-container-high dark:bg-surface-container dark:text-white text-on-surface-variant rounded-lg hover:bg-surface-variant dark:hover:bg-gray-600 transition-colors"
                    >
                        <span className="material-symbols-outlined">visibility</span>
                    </button>
                </div>
            </div>

            <UserProfileModal user={user} isOpen={showProfile} onClose={() => setShowProfile(false)} />
        </>
    );
});

function TeamPageLoading() {
    return (
        <TeamPageShell>
            <div className="mb-8 mt-8 animate-pulse">
                <div className="h-10 bg-slate-400 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-400 rounded w-2/3"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {skeletonCards.map((cardId) => (
                    <div key={cardId} className="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
                        <div className="w-20 h-20 rounded-2xl bg-slate-400 mb-6"></div>
                        <div className="h-6 bg-slate-400 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-400 rounded w-1/2 mb-6"></div>
                        <div className="flex gap-2">
                            <div className="flex-1 h-10 bg-slate-400 rounded"></div>
                            <div className="h-10 w-10 bg-slate-400 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </TeamPageShell>
    );
}

function TeamPageError({ error }: { error: string }) {
    return (
        <TeamPageShell>
            <p className="text-error">Error loading team: {error}</p>
        </TeamPageShell>
    );
}

export default function TeamPage() {
    const { users, teams, loading, error } = useTeamDirectory();
    const [activeRole, setActiveRole] = useState("All Members");

    const typedUsers = users as TeamUser[];

    const roles = useMemo(() => {
        const uniqueRoles = new Set(typedUsers.map((user) => user.role));
        return ["All Members", ...Array.from(uniqueRoles)];
    }, [typedUsers]);

    const filteredUsers = useMemo(() => {
        if (activeRole === "All Members") return typedUsers;
        return typedUsers.filter((user) => user.role === activeRole);
    }, [activeRole, typedUsers]);

    if (loading) return <TeamPageLoading />;
    if (error) return <TeamPageError error={error} />;

    return (
        <TeamPageShell>
            <div className="mb-8 mt-8">
                <h1 className="text-5xl font-extrabold font-manrope tracking-tighter text-on-surface mb-4">
                    Team Directory
                </h1>
                <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
                    {teams.length > 0
                        ? `Connect with the team at ${teams[0]?.name || "LucidFlow"}. Manage access, view availability, and collaborate with team members.`
                        : "Manage access, view availability, and collaborate with team members."}
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`${activeRole === role
                                ? "bg-primary text-white"
                                : "bg-surface-container-high dark:bg-surface-container dark:text-white text-on-surface-variant hover:bg-surface-variant dark:hover:bg-gray-600"
                                } px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">filter_list</span>
                        Sort by: Recently Active
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-on-surface-variant">No members found in this role</p>
                </div>
            )}
        </TeamPageShell>
    );
}
