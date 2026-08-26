import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl, resolveWsBaseUrl } from "../config/runtimeEndpoints";
import type { Message } from "../types";
import {
    RECONNECT_BASE_DELAY_MS,
    RECONNECT_MAX_ATTEMPTS,
    RECONNECT_MAX_DELAY_MS
} from "../features/messages";

interface UseMessagesRealtimeOptions {
    token: string | null;
    currentUserId: string | null;
}

interface UseMessagesRealtimeReturn {
    socket: WebSocket | null;
    liveMessages: Message[];
    pendingMessages: Map<string, Message>; // Temporary client messages
    liveError: string | null;
    socketReadyAt: number;
    conversationMapVersion: number;
    pendingDirectRecipientRef: React.MutableRefObject<string | null>;
    directConversationByUserIdRef: React.MutableRefObject<Map<string, string>>;
    sendMessage: (
        content: string,
        tab: "direct" | "channels",
        selectedChannelId: string | undefined,
        selectedConversationId: string | undefined,
        selectedUserId: string | undefined
    ) => Promise<void>;
    subscribeToChannel: (channelId: string) => void;
    subscribeToConversation: (conversationId: string | undefined) => void;
}

export function useMessagesRealtime(
    options: UseMessagesRealtimeOptions
): UseMessagesRealtimeReturn {
    const { token, currentUserId } = options;
    const [liveMessages, setLiveMessages] = useState<Message[]>([]);
    const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(new Map());
    const [liveError, setLiveError] = useState<string | null>(null);
    const [socketReadyAt, setSocketReadyAt] = useState(0);
    const [conversationMapVersion, setConversationMapVersion] = useState(0);

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const shouldReconnectRef = useRef(true);
    const pendingDirectRecipientRef = useRef<string | null>(null);
    const directConversationByUserIdRef = useRef(new Map<string, string>());
    const currentUserRef = useRef(currentUserId);

    useEffect(() => {
        currentUserRef.current = currentUserId;
    }, [currentUserId]);

    useEffect(() => {
        directConversationByUserIdRef.current = new Map();
        setConversationMapVersion((previous) => previous + 1);
    }, [currentUserId]);

    const clearReconnectTimer = () => {
        if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

    // Connection logic
    useEffect(() => {
        if (!token) {
            return;
        }

        shouldReconnectRef.current = true;

        const connect = () => {
            clearReconnectTimer();

            const startConnection = async () => {
                const wsBaseUrl = await resolveWsBaseUrl();
                if (!shouldReconnectRef.current) {
                    return;
                }

                const socket = new WebSocket(`${wsBaseUrl}/ws/messages?token=${encodeURIComponent(token)}`);
                socketRef.current = socket;

                socket.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type !== "message.created") {
                            return;
                        }

                        const nextMessage = payload.data as Message;
                        nextMessage._status = 'delivered';
                        setLiveMessages((prev) => {
                            if (prev.some((message) => message.id === nextMessage.id)) {
                                return prev;
                            }
                            return [...prev, nextMessage];
                        });

                        // Remove pending message when server confirms delivery
                        if (nextMessage.user?.id === currentUserRef.current) {
                            setPendingMessages((prev) => {
                                const next = new Map(prev);

                                // Match pending message by content and proximity to sent time
                                for (const [tempId, pendingMsg] of next.entries()) {
                                    if (
                                        pendingMsg.content === nextMessage.content &&
                                        pendingMsg.channelId === nextMessage.channelId &&
                                        pendingMsg.conversationId === nextMessage.conversationId
                                    ) {
                                        // Check timestamp is within 5 seconds (account for processing delay)
                                        const pendingTime = new Date(pendingMsg.createdAt).getTime();
                                        const confirmedTime = new Date(nextMessage.createdAt).getTime();
                                        if (Math.abs(confirmedTime - pendingTime) < 5000) {
                                            // Remove from pending so only server message shows
                                            next.delete(tempId);
                                            break;
                                        }
                                    }
                                }

                                return next;
                            });
                        }

                        const pendingRecipient = pendingDirectRecipientRef.current;
                        if (
                            pendingRecipient &&
                            !nextMessage.channelId &&
                            nextMessage.conversationId &&
                            nextMessage.user?.id === (currentUserRef.current || "")
                        ) {
                            directConversationByUserIdRef.current.set(pendingRecipient, nextMessage.conversationId);
                            pendingDirectRecipientRef.current = null;
                            setConversationMapVersion((previous) => previous + 1);
                        }
                    } catch {
                        // Ignore invalid socket payloads
                    }
                };

                socket.onopen = () => {
                    reconnectAttemptsRef.current = 0;
                    setLiveError(null);
                    setSocketReadyAt(Date.now());
                };

                socket.onclose = () => {
                    socketRef.current = null;

                    if (!shouldReconnectRef.current) {
                        return;
                    }

                    reconnectAttemptsRef.current += 1;
                    const attempt = reconnectAttemptsRef.current;

                    if (attempt <= RECONNECT_MAX_ATTEMPTS) {
                        const delayMs = Math.min(RECONNECT_BASE_DELAY_MS * (2 ** (attempt - 1)), RECONNECT_MAX_DELAY_MS);
                        setLiveError("Real-time disconnected. Reconnecting...");
                        reconnectTimeoutRef.current = window.setTimeout(connect, delayMs);
                    } else {
                        setLiveError("Real-time connection unavailable. Falling back to HTTP where possible.");
                    }
                };

                socket.onerror = () => {
                    // onclose handles retries and user-facing messaging.
                };
            };

            void startConnection();
        };

        connect();

        return () => {
            shouldReconnectRef.current = false;
            clearReconnectTimer();

            if (socketRef.current) {
                socketRef.current.close();
            }
            socketRef.current = null;
        };
    }, [token]);

    const subscribeToChannel = useCallback((channelId: string) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        socket.send(
            JSON.stringify({
                type: "subscribe",
                channelId
            })
        );
    }, []);

    const subscribeToConversation = useCallback((conversationId: string | undefined) => {
        if (!conversationId) {
            return;
        }

        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        socket.send(
            JSON.stringify({
                type: "subscribe",
                conversationId
            })
        );
    }, []);

    async function sendMessageFallback(
        content: string,
        tab: "direct" | "channels",
        selectedChannelId: string | undefined,
        selectedConversationId: string | undefined,
        selectedUserId: string | undefined
    ) {
        if (!token || !currentUserRef.current) {
            throw new Error("You must be logged in to send messages.");
        }

        const body: Record<string, string> = {
            content,
            type: "TEXT",
            userId: currentUserRef.current
        };

        if (tab === "channels") {
            if (!selectedChannelId) {
                throw new Error("Select a channel first.");
            }
            body.channelId = selectedChannelId;
        } else {
            if (selectedConversationId) {
                body.conversationId = selectedConversationId;
            } else if (selectedUserId) {
                body.recipientUserId = selectedUserId;
            } else {
                throw new Error("Select a teammate before sending a direct message.");
            }
        }

        const messageUrl = await buildApiUrl('/messages');
        const response = await fetch(messageUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || "Failed to send message");
        }

        const payload = await response.json();
        const created = (payload?.data ?? payload) as Message;
        created._status = 'delivered';

        setLiveMessages((prev) => (prev.some((message) => message.id === created.id) ? prev : [...prev, created]));

        // Remove pending message when HTTP confirms delivery
        setPendingMessages((prev) => {
            const next = new Map(prev);
            for (const [tempId, pendingMsg] of next.entries()) {
                if (
                    pendingMsg.content === created.content &&
                    pendingMsg.channelId === created.channelId &&
                    pendingMsg.conversationId === created.conversationId
                ) {
                    const pendingTime = new Date(pendingMsg.createdAt).getTime();
                    const confirmedTime = new Date(created.createdAt).getTime();
                    if (Math.abs(confirmedTime - pendingTime) < 5000) {
                        // Remove from pending so only server message shows
                        next.delete(tempId);
                        break;
                    }
                }
            }
            return next;
        });
    }

    async function sendMessage(
        content: string,
        tab: "direct" | "channels",
        selectedChannelId: string | undefined,
        selectedConversationId: string | undefined,
        selectedUserId: string | undefined
    ) {
        if (!content.trim()) {
            throw new Error("Message cannot be empty.");
        }

        setLiveError(null);

        // Add optimistic message immediately
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMessage: Message = {
            id: tempId,
            _tempId: tempId,
            content: content.trim(),
            channelId: tab === 'channels' ? selectedChannelId : null,
            conversationId: selectedConversationId || undefined,
            createdAt: new Date().toISOString(),
            user: { id: currentUserRef.current || '', name: 'You', avatar: '' },
            _status: 'sending'
        };
        setPendingMessages((prev) => new Map(prev).set(tempId, optimisticMessage));

        try {
            const socket = socketRef.current;

            if (tab === "channels") {
                if (!selectedChannelId) {
                    throw new Error("Select a channel before sending a message.");
                }

                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "sendMessage", content, channelId: selectedChannelId }));
                } else {
                    await sendMessageFallback(content, tab, selectedChannelId, selectedConversationId, selectedUserId);
                }
            } else {
                if (!selectedUserId) {
                    throw new Error("Select a teammate before sending a direct message.");
                }

                if (socket && socket.readyState === WebSocket.OPEN) {
                    pendingDirectRecipientRef.current = selectedUserId;
                    socket.send(
                        JSON.stringify({
                            type: "sendMessage",
                            content,
                            ...(selectedConversationId
                                ? { conversationId: selectedConversationId }
                                : { recipientUserId: selectedUserId })
                        })
                    );
                } else {
                    await sendMessageFallback(content, tab, selectedChannelId, selectedConversationId, selectedUserId);
                }
            }
        } catch (error) {
            // Remove pending message on error
            setPendingMessages((prev) => {
                const next = new Map(prev);
                next.delete(tempId);
                return next;
            });
            const errorMessage = error instanceof Error ? error.message : "Unable to send message";
            setLiveError(errorMessage);
            throw error;
        }
    }

    return useMemo(
        () => ({
            socket: socketRef.current,
            liveMessages,
            pendingMessages,
            liveError,
            socketReadyAt,
            conversationMapVersion,
            pendingDirectRecipientRef,
            directConversationByUserIdRef,
            sendMessage,
            subscribeToChannel,
            subscribeToConversation
        }),
        [liveMessages, pendingMessages, liveError, socketReadyAt, conversationMapVersion]
    );
}
