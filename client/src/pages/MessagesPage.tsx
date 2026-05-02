import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChannels, useMessages, useUsers } from "../hooks/useApi";
import { useMessagesRealtime } from "../hooks/useMessagesRealtime";
import { useAuth } from "../contexts/AuthContext";
import type { Channel, Message } from "../types";
import type { User } from "../types/messages";
import {
    MessageRow,
    CHAT_SCROLL_NEAR_BOTTOM_PX,
    buildThreadKey,
    computeLatestChannelTimestamps,
    computeLatestDirectTimestamps,
    dedupeAndSortMessages
} from "../features/messages";

export default function MessagesPage() {
    const { user: currentUser, token } = useAuth();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<"direct" | "channels">("direct");
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");
    const [selectedUserId, setSelectedUserId] = useState<string>(searchParams.get("directUser") || "");
    const [search, setSearch] = useState("");
    const [draftMessage, setDraftMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [conversationMapVersion, setConversationMapVersion] = useState(0);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const previousThreadKeyRef = useRef<string>("");
    const autoScrolledThreadsRef = useRef(new Set<string>());

    const { users, loading: usersLoading, error: usersError } = useUsers();
    const { channels, loading: channelsLoading, error: channelsError } = useChannels();
    const { messages: directTabMessages, loading: directMessagesLoading, error: directMessagesError } = useMessages(undefined, undefined, { enabled: activeTab === "direct" });
    const { messages: channelMessages, loading: channelMessagesLoading, error: channelMessagesError } = useMessages(
        selectedChannelId || undefined,
        undefined,
        { enabled: activeTab === "channels" && Boolean(selectedChannelId) }
    );

    const {
        liveMessages,
        pendingMessages,
        liveError,
        pendingDirectRecipientRef,
        directConversationByUserIdRef,
        sendMessage: sendRealtimeMessage,
        subscribeToChannel,
        subscribeToConversation
    } = useMessagesRealtime({
        token,
        currentUserId: currentUser?.id || null
    });

    const typedUsers = users as User[];
    const typedChannels = channels as Channel[];
    const typedDirectTabMessages = directTabMessages as Message[];
    const typedChannelMessages = channelMessages as Message[];

    const mergedDirectBase = useMemo(
        () => dedupeAndSortMessages([...typedDirectTabMessages, ...liveMessages.filter((message) => !message.channelId)]),
        [typedDirectTabMessages, liveMessages]
    );

    const mergedChannelBase = useMemo(
        () => dedupeAndSortMessages([...typedChannelMessages, ...liveMessages.filter((message) => Boolean(message.channelId))]),
        [typedChannelMessages, liveMessages]
    );

    const isDirectTab = activeTab === "direct";
    const isChannelsTab = activeTab === "channels";

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
        () => mergedDirectBase.filter((message) => !message.channelId),
        [mergedDirectBase]
    );

    // Update direct conversation map from incoming messages
    useEffect(() => {
        if (!currentUser?.id) {
            return;
        }

        const directMap = directConversationByUserIdRef.current;
        let mapChanged = false;

        for (const message of directMessages) {
            if (!message.conversationId) {
                continue;
            }

            const participantIds = Array.isArray(message.conversation?.participantIds)
                ? message.conversation.participantIds.filter((id): id is string => typeof id === "string")
                : [];

            if (participantIds.length > 0 && participantIds.includes(currentUser.id)) {
                const otherParticipantId = participantIds.find((id) => id !== currentUser.id);
                if (otherParticipantId) {
                    const previousConversationId = directMap.get(otherParticipantId);
                    if (previousConversationId !== message.conversationId) {
                        directMap.set(otherParticipantId, message.conversationId);
                        mapChanged = true;
                    }
                    continue;
                }
            }

            const authorId = message.user?.id;
            if (authorId && authorId !== currentUser.id) {
                const previousConversationId = directMap.get(authorId);
                if (previousConversationId !== message.conversationId) {
                    directMap.set(authorId, message.conversationId);
                    mapChanged = true;
                }
            }
        }

        if (mapChanged) {
            setConversationMapVersion((previous) => previous + 1);
        }
    }, [directMessages, currentUser?.id]);

    const latestDirectMessageTsByUserId = useMemo(
        () => computeLatestDirectTimestamps(directMessages, currentUser?.id),
        [directMessages, currentUser?.id]
    );

    const latestChannelMessageTsByChannelId = useMemo(
        () => computeLatestChannelTimestamps(mergedChannelBase),
        [mergedChannelBase]
    );

    const selectedUser = useMemo(
        () => typedUsers.find((user) => user.id === selectedUserId),
        [selectedUserId, typedUsers]
    );

    const selectedChannel = useMemo(
        () => typedChannels.find((channel) => channel.id === selectedChannelId),
        [selectedChannelId, typedChannels]
    );

    const selectedConversationId = useMemo(() => {
        if (!selectedUserId) {
            return undefined;
        }
        return directConversationByUserIdRef.current.get(selectedUserId);
    }, [selectedUserId, directMessages, conversationMapVersion]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = typedUsers.filter((user) => {
            if (query && !user.name.toLowerCase().includes(query)) return false;
            return user.id !== currentUser?.id;
        });

        filtered.sort((a, b) => {
            const lastMessageA = latestDirectMessageTsByUserId.get(a.id) || 0;
            const lastMessageB = latestDirectMessageTsByUserId.get(b.id) || 0;
            return lastMessageB - lastMessageA;
        });

        return filtered;
    }, [search, typedUsers, latestDirectMessageTsByUserId, currentUser?.id]);

    const filteredChannels = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = typedChannels.filter((channel) => {
            if (query && !channel.name.toLowerCase().includes(query)) return false;
            return true;
        });

        // Sort by most recent message in that channel
        filtered.sort((a, b) => {
            const lastMessageA = latestChannelMessageTsByChannelId.get(a.id) || 0;
            const lastMessageB = latestChannelMessageTsByChannelId.get(b.id) || 0;
            return lastMessageB - lastMessageA;
        });

        return filtered;
    }, [search, typedChannels, latestChannelMessageTsByChannelId]);

    const activeMessages = useMemo(
        () => {
            let messages;

            if (activeTab === "channels") {
                messages = mergedChannelBase.filter((message) => message.channelId === selectedChannelId);
            } else {
                if (selectedConversationId) {
                    messages = directMessages.filter((message) => message.conversationId === selectedConversationId);
                } else {
                    // While a new direct conversation is being established, include the
                    // current user's just-sent messages for the selected recipient.
                    messages = directMessages.filter((message) => {
                        const authorId = message.user?.id;
                        if (authorId === selectedUserId) {
                            return true;
                        }

                        return (
                            authorId === currentUser?.id &&
                            pendingDirectRecipientRef.current === selectedUserId
                        );
                    });
                }
            }

            // Add pending messages for current thread
            const allMessages = [...messages];
            for (const pendingMsg of pendingMessages.values()) {
                if (activeTab === "channels" && pendingMsg.channelId === selectedChannelId) {
                    allMessages.push(pendingMsg);
                } else if (activeTab === "direct" && pendingMsg.conversationId === selectedConversationId) {
                    allMessages.push(pendingMsg);
                }
            }

            return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        },
        [activeTab, mergedChannelBase, directMessages, selectedUserId, selectedChannelId, selectedConversationId, currentUser?.id, pendingMessages]
    );

    const sidebarLoading = usersLoading || channelsLoading;
    const sidebarError = usersError || channelsError;
    const messageLoading = isChannelsTab ? channelMessagesLoading : directMessagesLoading;
    const messageError = liveError || (isChannelsTab ? channelMessagesError : directMessagesError);

    const activeThreadKey = useMemo(
        () => buildThreadKey(activeTab, selectedChannelId, selectedConversationId, selectedUserId),
        [activeTab, selectedChannelId, selectedConversationId, selectedUserId]
    );

    useEffect(() => {
        if (previousThreadKeyRef.current !== activeThreadKey) {
            autoScrolledThreadsRef.current.delete(activeThreadKey);
        }

        if (messageLoading) {
            return;
        }

        if (!messagesContainerRef.current) {
            return;
        }

        if (
            previousThreadKeyRef.current !== activeThreadKey ||
            (!autoScrolledThreadsRef.current.has(activeThreadKey) && activeMessages.length > 0)
        ) {
            previousThreadKeyRef.current = activeThreadKey;
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
            autoScrolledThreadsRef.current.add(activeThreadKey);
        }
    }, [activeThreadKey, messageLoading, activeMessages.length]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) {
            return;
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom <= CHAT_SCROLL_NEAR_BOTTOM_PX) {
            container.scrollTop = container.scrollHeight;
        }
    }, [activeMessages.length]);

    // Subscribe to channels or conversations when they are selected
    // For direct messaging, also depend on conversationMapVersion to ensure we retry when the map updates
    useEffect(() => {
        if (activeTab === "channels" && selectedChannelId) {
            subscribeToChannel(selectedChannelId);
        } else if (activeTab === "direct" && selectedConversationId) {
            subscribeToConversation(selectedConversationId);
        }
    }, [activeTab, selectedChannelId, selectedConversationId, conversationMapVersion, subscribeToChannel, subscribeToConversation]);

    async function handleSendMessage() {
        const content = draftMessage.trim();
        if (!content || sending) {
            return;
        }

        setSending(true);

        try {
            await sendRealtimeMessage(
                content,
                activeTab,
                selectedChannelId,
                selectedConversationId,
                selectedUserId
            );
            setDraftMessage("");
        } finally {
            setSending(false);
        }
    }
    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="px-6 pb-8 pt-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[calc(100vh-10rem)]">
                    <div
                        className="md:col-span-1 md:sticky md:top-24 self-start md:h-[calc(100vh-10rem)] bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col min-h-0"
                    >
                        <div className="p-5 border-b border-outline-variant">
                            <h2 className="font-manrope text-3xl font-extrabold text-on-surface tracking-tighter mb-1">Messages</h2>
                            <p className="text-xs text-on-surface-variant leading-relaxed">Stay connected with your team. Messages are loaded from the server in real time.</p>
                        </div>

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

                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {sidebarLoading ? (
                                <div className="p-4 text-sm text-on-surface-variant">Loading...</div>
                            ) : sidebarError ? (
                                <div className="p-4 text-sm text-error">{sidebarError}</div>
                            ) : activeTab === "direct" ? (
                                filteredUsers.map((user) => (
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

                    <div
                        className="md:col-span-2 md:h-[calc(100vh-10rem)] bg-surface-container-lowest rounded-2xl flex flex-col hidden md:flex"
                    >
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

                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
                            {messageLoading ? (
                                <p className="text-sm text-on-surface-variant">Loading messages...</p>
                            ) : messageError ? (
                                <p className="text-sm text-error">{messageError}</p>
                            ) : activeMessages.length === 0 ? (
                                <p className="text-sm text-on-surface-variant">No messages found.</p>
                            ) : (
                                activeMessages.map((message, index) => {
                                    const previousMessage = activeMessages[index - 1];
                                    const nextMessage = activeMessages[index + 1];
                                    const isOwnMessage = message.user?.id === currentUser?.id;
                                    const isLastConsecutiveOwn = isOwnMessage && (!nextMessage || nextMessage.user?.id !== currentUser?.id);

                                    return (
                                        <MessageRow
                                            key={message.id}
                                            message={message}
                                            previousMessage={previousMessage}
                                            currentUserId={currentUser?.id}
                                            showDelivered={isLastConsecutiveOwn}
                                        />
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 border-t border-outline-variant flex gap-3">
                            <input
                                type="text"
                                value={draftMessage}
                                onChange={(event) => setDraftMessage(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void handleSendMessage();
                                    }
                                }}
                                placeholder="Type your message..."
                                className="flex-1 bg-surface-container text-on-surface rounded-lg px-4 py-2.5 outline-none text-sm placeholder-on-surface-variant"
                            />
                            <button
                                onClick={() => void handleSendMessage()}
                                className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-lg disabled:opacity-50"
                                disabled={!draftMessage.trim() || sending}
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
