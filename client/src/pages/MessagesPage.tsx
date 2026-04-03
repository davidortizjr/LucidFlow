import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChannels, useMessages, useUsers } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import type { Channel, Message } from "../types";
import type { User } from "../types/messages";

function formatRelative(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export default function MessagesPage() {
    const { user: currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<"direct" | "channels">("direct");
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");
    const [selectedUserId, setSelectedUserId] = useState<string>(searchParams.get("directUser") || "");
    const [search, setSearch] = useState("");
    const isDirectTab = activeTab === "direct";
    const isChannelsTab = activeTab === "channels";

    const { users, loading: usersLoading, error: usersError } = useUsers();
    const { channels, loading: channelsLoading, error: channelsError } = useChannels();
    const { messages: directTabMessages, loading: directMessagesLoading, error: directMessagesError } = useMessages(undefined, undefined, { enabled: isDirectTab });
    const { messages: channelMessages, loading: channelMessagesLoading, error: channelMessagesError } = useMessages(
        selectedChannelId || undefined,
        undefined,
        { enabled: isChannelsTab && Boolean(selectedChannelId) }
    );

    const typedUsers = users as User[];
    const typedChannels = channels as Channel[];
    const typedDirectTabMessages = directTabMessages as Message[];
    const typedChannelMessages = channelMessages as Message[];

    useEffect(() => {
        if (!selectedChannelId && typedChannels.length > 0) {
            setSelectedChannelId(typedChannels[0].id);
        }
    }, [selectedChannelId, typedChannels]);

    useEffect(() => {
        if (isDirectTab) {
            const availableUsers = typedUsers.filter(user => user.id !== currentUser?.id);
            if (availableUsers.length > 0 && !selectedUserId) {
                setSelectedUserId(availableUsers[0].id);
            }
        }
    }, [isDirectTab, typedUsers, selectedUserId, currentUser?.id]);

    const directMessages = useMemo(
        () => typedDirectTabMessages.filter((message) => !message.channelId),
        [typedDirectTabMessages]
    );

    const selectedUser = useMemo(
        () => typedUsers.find((user) => user.id === selectedUserId),
        [selectedUserId, typedUsers]
    );

    const selectedChannel = useMemo(
        () => typedChannels.find((channel) => channel.id === selectedChannelId),
        [selectedChannelId, typedChannels]
    );

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        let filtered = typedUsers.filter((user) => {
            if (query && !user.name.toLowerCase().includes(query)) return false;
            return user.id !== currentUser?.id;
        });

        filtered.sort((a, b) => {
            const messagesWithA = directMessages.filter((msg) => msg.user?.id === a.id);
            const messagesWithB = directMessages.filter((msg) => msg.user?.id === b.id);

            const lastMessageA = messagesWithA[messagesWithA.length - 1]?.createdAt;
            const lastMessageB = messagesWithB[messagesWithB.length - 1]?.createdAt;

            if (!lastMessageA && !lastMessageB) return 0;
            if (!lastMessageA) return 1;
            if (!lastMessageB) return -1;

            return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
        });

        return filtered;
    }, [search, typedUsers, directMessages, currentUser?.id]);

    const filteredChannels = useMemo(() => {
        const query = search.trim().toLowerCase();
        let filtered = typedChannels.filter((channel) => {
            if (query && !channel.name.toLowerCase().includes(query)) return false;
            return true;
        });

        // Sort by most recent message in that channel
        filtered.sort((a, b) => {
            const messagesInA = typedChannelMessages.filter((msg) => msg.channelId === a.id);
            const messagesInB = typedChannelMessages.filter((msg) => msg.channelId === b.id);

            const lastMessageA = messagesInA[messagesInA.length - 1]?.createdAt;
            const lastMessageB = messagesInB[messagesInB.length - 1]?.createdAt;

            if (!lastMessageA && !lastMessageB) return 0;
            if (!lastMessageA) return 1;
            if (!lastMessageB) return -1;

            return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
        });

        return filtered;
    }, [search, typedChannels, typedChannelMessages]);

    const activeMessages = useMemo(
        () => {
            let messages;

            if (activeTab === "channels") {
                messages = typedChannelMessages;
            } else {
                messages = directMessages.filter((message) => message.user?.id === selectedUserId);
            }

            return messages;
        },
        [activeTab, typedChannelMessages, directMessages, selectedUserId]
    );
    const sidebarLoading = usersLoading || channelsLoading;
    const sidebarError = usersError || channelsError;
    const messageLoading = isChannelsTab ? channelMessagesLoading : directMessagesLoading;
    const messageError = isChannelsTab ? channelMessagesError : directMessagesError;

    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="px-6 pb-12 pt-8">
                <header className="mb-8 mt-8">
                    <h2 className="font-manrope text-5xl font-extrabold text-on-surface tracking-tighter mb-2">Messages</h2>
                    <p className="text-on-surface-variant max-w-lg leading-relaxed">Stay connected with your team. Messages are loaded from the server in real time.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                    <div className="md:col-span-1 bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-outline-variant flex gap-0">
                            <button
                                onClick={() => setActiveTab("direct")}
                                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === "direct" ? "bg-surface-container text-primary" : "bg-transparent text-on-surface-variant hover:text-on-surface"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg mr-1 align-middle">person</span>
                                Direct
                            </button>
                            <button
                                onClick={() => setActiveTab("channels")}
                                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === "channels" ? "bg-surface-container text-primary" : "bg-transparent text-on-surface-variant hover:text-on-surface"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg mr-1 align-middle">tag</span>
                                Channels
                            </button>
                        </div>

                        <div className="p-4 border-b border-outline-variant">
                            <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg">
                                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={activeTab === "direct" ? "Search members..." : "Search channels..."}
                                    className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder-on-surface-variant"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {sidebarLoading ? (
                                <div className="p-4 text-sm text-on-surface-variant">Loading...</div>
                            ) : sidebarError ? (
                                <div className="p-4 text-sm text-error">{sidebarError}</div>
                            ) : activeTab === "direct" ? (
                                filteredUsers.filter(user => user.id !== currentUser?.id).map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`w-full p-4 border-b border-outline-variant text-left transition-colors ${selectedUserId === user.id ? "bg-surface-container" : "hover:bg-surface-container"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-semibold text-on-surface truncate">{user.name}</h3>
                                                <p className="text-xs text-on-surface-variant">{user.status || "offline"}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                filteredChannels.map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setSelectedChannelId(channel.id)}
                                        className={`w-full p-4 border-b border-outline-variant text-left transition-colors ${selectedChannelId === channel.id ? "bg-surface-container" : "hover:bg-surface-container"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">tag</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-semibold text-on-surface truncate">#{channel.name}</h3>
                                                <p className="text-xs text-on-surface-variant">{channel.members?.length || 0} members</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl flex flex-col hidden md:flex">
                        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {activeTab === "channels" ? (
                                    <>
                                        <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">tag</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-on-surface">#{selectedChannel?.name || "Channel"}</h3>
                                            <p className="text-xs text-on-surface-variant">{selectedChannel?.members?.length || 0} members</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <img
                                            src={selectedUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                                            alt={selectedUser?.name || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-on-surface">{selectedUser?.name || "Direct Message"}</h3>
                                            <p className="text-xs text-on-surface-variant">{selectedUser?.status || "offline"}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messageLoading ? (
                                <p className="text-sm text-on-surface-variant">Loading messages...</p>
                            ) : messageError ? (
                                <p className="text-sm text-error">{messageError}</p>
                            ) : activeMessages.length === 0 ? (
                                <p className="text-sm text-on-surface-variant">No messages found.</p>
                            ) : (
                                activeMessages.map((message) => (
                                    <div key={message.id} className="flex gap-3">
                                        <img
                                            src={message.user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                                            alt={message.user?.name || "User"}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="text-xs text-on-surface-variant font-semibold">{message.user?.name || "Unknown"}</div>
                                            <div className="bg-surface-container p-3 rounded-lg text-sm text-on-surface max-w-lg">{message.content}</div>
                                            <div className="text-xs text-on-surface-variant">{formatRelative(message.createdAt)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-outline-variant flex gap-3">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 bg-surface-container text-on-surface rounded-lg px-4 py-2.5 outline-none text-sm placeholder-on-surface-variant"
                            />
                            <button className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-lg opacity-50" disabled>
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
