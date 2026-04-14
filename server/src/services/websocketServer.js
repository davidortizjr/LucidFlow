import { WebSocketServer } from 'ws';
import { URL } from 'url';
import { randomUUID } from 'crypto';
import { verifyToken } from '../middleware/auth.js';
import { arcjetProtectWebSocketUpgrade } from '../middleware/arcjet.js';
import { createRedisPubSub } from './redisPubSub.js';

const WS_PATH = '/ws/messages';
const HEARTBEAT_INTERVAL_MS = 30_000;
const INSTANCE_ID = randomUUID();

function sendJson(socket, payload) {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(payload));
    }
}

async function ensureConversationForDirectMessage(prisma, senderId, recipientUserId) {
    const normalizedParticipantIds = [senderId, recipientUserId].sort();

    const existing = await prisma.conversation.findFirst({
        where: {
            participantIds: {
                array_contains: normalizedParticipantIds
            }
        },
        select: {
            id: true,
            participantIds: true
        }
    });

    if (existing) {
        return existing;
    }

    return prisma.conversation.create({
        data: {
            participantIds: normalizedParticipantIds
        }
    });
}

export function createMessagingWebSocketServer({ server, prisma, onMessageCreated }) {
    const wss = new WebSocketServer({ noServer: true });

    const channels = new Map();
    const conversations = new Map();
    const users = new Map();
    const clients = new Map();

    const redisBus = createRedisPubSub({
        onMessage: async (rawMessage) => {
            try {
                const parsed = JSON.parse(rawMessage);
                if (parsed.instanceId === INSTANCE_ID) {
                    return;
                }

                if (parsed.type !== 'message.created' || !parsed.message) {
                    return;
                }

                localBroadcastMessage(parsed.message, parsed.options || {});
            } catch {
            }
        }
    });

    if (redisBus.enabled && typeof redisBus.ensureConnected === 'function') {
        void redisBus.ensureConnected();
    }

    function addToMap(map, key, socket) {
        if (!key) return;
        if (!map.has(key)) {
            map.set(key, new Set());
        }
        map.get(key).add(socket);
    }

    function removeFromMap(map, key, socket) {
        if (!key || !map.has(key)) return;
        const set = map.get(key);
        set.delete(socket);
        if (set.size === 0) {
            map.delete(key);
        }
    }

    function detachSocket(socket) {
        const state = clients.get(socket);
        if (!state) return;

        removeFromMap(channels, state.channelId, socket);
        removeFromMap(conversations, state.conversationId, socket);
        removeFromMap(users, state.userId, socket);
        clients.delete(socket);
    }

    function subscribeSocket(socket, subscription) {
        const state = clients.get(socket);
        if (!state) return;

        removeFromMap(channels, state.channelId, socket);
        removeFromMap(conversations, state.conversationId, socket);

        state.channelId = subscription.channelId || null;
        state.conversationId = subscription.conversationId || null;

        if (state.channelId) {
            addToMap(channels, state.channelId, socket);
        } else if (state.conversationId) {
            addToMap(conversations, state.conversationId, socket);
        }
    }

    async function validateSubscriptionForUser(userId, subscription = {}) {
        const { channelId, conversationId } = subscription;

        if (channelId && conversationId) {
            return { ok: false, reason: 'Cannot subscribe to channel and conversation simultaneously' };
        }

        if (channelId) {
            const channel = await prisma.channel.findFirst({
                where: {
                    id: channelId,
                    members: {
                        some: {
                            id: userId
                        }
                    }
                },
                select: { id: true }
            });

            if (!channel) {
                return { ok: false, reason: 'Not authorized for this channel' };
            }
        }

        if (conversationId) {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    participantIds: {
                        array_contains: [userId]
                    }
                },
                select: { id: true }
            });

            if (!conversation) {
                return { ok: false, reason: 'Not authorized for this conversation' };
            }
        }

        return { ok: true };
    }

    async function handleSendMessage(socket, payload) {
        const state = clients.get(socket);
        if (!state) {
            return;
        }

        const content = typeof payload.content === 'string' ? payload.content.trim() : '';
        if (!content) {
            sendJson(socket, { type: 'error', message: 'Message content is required' });
            return;
        }

        const hasChannelId = Boolean(payload.channelId);
        const hasConversationId = Boolean(payload.conversationId);
        const hasRecipient = Boolean(payload.recipientUserId);
        if (!hasChannelId && !hasConversationId && !hasRecipient) {
            sendJson(socket, { type: 'error', message: 'Provide channelId, conversationId, or recipientUserId' });
            return;
        }

        if (hasChannelId && (hasConversationId || hasRecipient)) {
            sendJson(socket, { type: 'error', message: 'Provide either channel context or direct context, not both' });
            return;
        }

        let channelId = null;
        let conversationId = null;
        let directParticipantIds = null;

        if (hasChannelId) {
            channelId = payload.channelId;
        } else if (hasConversationId) {
            const conversation = await prisma.conversation.findUnique({
                where: { id: payload.conversationId },
                select: { participantIds: true }
            });

            if (!Array.isArray(conversation?.participantIds)) {
                sendJson(socket, { type: 'error', message: 'Conversation not found' });
                return;
            }

            const participants = conversation.participantIds.filter((id) => typeof id === 'string');
            if (!participants.includes(state.userId)) {
                sendJson(socket, { type: 'error', message: 'Not authorized for this conversation' });
                return;
            }

            conversationId = payload.conversationId;
            directParticipantIds = participants;
        } else {
            const recipientUserId = payload.recipientUserId;
            if (recipientUserId === state.userId) {
                sendJson(socket, { type: 'error', message: 'Cannot message yourself' });
                return;
            }

            const conversation = await ensureConversationForDirectMessage(prisma, state.userId, recipientUserId);
            conversationId = conversation.id;
            directParticipantIds = [state.userId, recipientUserId];
        }

        const message = await prisma.message.create({
            data: {
                content,
                type: 'TEXT',
                userId: state.userId,
                channelId,
                conversationId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                conversation: {
                    select: {
                        participantIds: true
                    }
                }
            }
        });

        broadcastMessage(message, { directParticipantIds });

        if (typeof onMessageCreated === 'function') {
            await Promise.resolve(onMessageCreated(message, { directParticipantIds }));
        }
    }

    function broadcastToSet(set, payload) {
        if (!set) return;
        for (const socket of set) {
            sendJson(socket, payload);
        }
    }

    function localBroadcastMessage(message, options = {}) {
        const payload = {
            type: 'message.created',
            data: message
        };

        if (message.channelId) {
            broadcastToSet(channels.get(message.channelId), payload);
            return;
        }

        if (message.conversationId) {
            broadcastToSet(conversations.get(message.conversationId), payload);

            const participants = options.directParticipantIds || [];
            for (const participantId of participants) {
                broadcastToSet(users.get(participantId), payload);
            }
        }
    }

    function broadcastMessage(message, options = {}) {
        localBroadcastMessage(message, options);

        if (!redisBus.enabled) {
            return;
        }

        const redisPayload = JSON.stringify({
            instanceId: INSTANCE_ID,
            type: 'message.created',
            message,
            options
        });

        void redisBus.publish(redisPayload);
    }

    wss.on('connection', (socket, req, meta) => {
        const initialState = {
            userId: meta.userId,
            channelId: meta.channelId || null,
            conversationId: meta.conversationId || null,
            isAlive: true
        };

        clients.set(socket, initialState);
        addToMap(users, initialState.userId, socket);
        subscribeSocket(socket, {
            channelId: initialState.channelId,
            conversationId: initialState.conversationId
        });

        sendJson(socket, {
            type: 'connected',
            data: {
                userId: initialState.userId,
                channelId: initialState.channelId,
                conversationId: initialState.conversationId
            }
        });

        socket.on('pong', () => {
            const state = clients.get(socket);
            if (state) {
                state.isAlive = true;
            }
        });

        socket.on('message', async (buffer) => {
            try {
                const parsed = JSON.parse(buffer.toString());

                if (parsed.type === 'ping') {
                    sendJson(socket, { type: 'pong' });
                    return;
                }

                if (parsed.type === 'subscribe') {
                    const state = clients.get(socket);
                    if (!state) {
                        sendJson(socket, { type: 'error', message: 'Socket state unavailable' });
                        return;
                    }

                    const validation = await validateSubscriptionForUser(state.userId, {
                        channelId: parsed.channelId,
                        conversationId: parsed.conversationId
                    });

                    if (!validation.ok) {
                        sendJson(socket, { type: 'error', message: validation.reason });
                        return;
                    }

                    subscribeSocket(socket, {
                        channelId: parsed.channelId,
                        conversationId: parsed.conversationId
                    });
                    sendJson(socket, {
                        type: 'subscribed',
                        data: {
                            channelId: parsed.channelId || null,
                            conversationId: parsed.conversationId || null
                        }
                    });
                    return;
                }

                if (parsed.type === 'sendMessage') {
                    await handleSendMessage(socket, parsed);
                    return;
                }

                sendJson(socket, { type: 'error', message: 'Unknown websocket message type' });
            } catch (error) {
                sendJson(socket, { type: 'error', message: error.message || 'Invalid websocket payload' });
            }
        });

        socket.on('close', () => {
            detachSocket(socket);
        });

        socket.on('error', () => {
            detachSocket(socket);
        });
    });

    const heartbeat = setInterval(() => {
        for (const [socket, state] of clients.entries()) {
            if (!state.isAlive) {
                detachSocket(socket);
                socket.terminate();
                continue;
            }

            state.isAlive = false;
            socket.ping();
        }
    }, HEARTBEAT_INTERVAL_MS);

    server.on('upgrade', async (req, socket, head) => {
        try {
            const requestUrl = new URL(req.url, `http://${req.headers.host}`);
            if (requestUrl.pathname !== WS_PATH) {
                socket.write('HTTP/1.1 404 Not Found\\r\\n\\r\\n');
                socket.destroy();
                return;
            }

            const isAllowedByArcjet = await arcjetProtectWebSocketUpgrade(req);
            if (!isAllowedByArcjet) {
                socket.write('HTTP/1.1 429 Too Many Requests\\r\\n\\r\\n');
                socket.destroy();
                return;
            }

            const token = requestUrl.searchParams.get('token');
            const decoded = token ? verifyToken(token) : null;

            if (!decoded?.userId) {
                socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
                socket.destroy();
                return;
            }

            const channelId = requestUrl.searchParams.get('channelId');
            const conversationId = requestUrl.searchParams.get('conversationId');

            const validation = await validateSubscriptionForUser(decoded.userId, {
                channelId,
                conversationId
            });

            if (!validation.ok) {
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req, {
                    userId: decoded.userId,
                    channelId,
                    conversationId
                });
            });
        } catch (_error) {
            socket.destroy();
        }
    });

    return {
        broadcastMessage,
        shutdown() {
            clearInterval(heartbeat);
            for (const socket of clients.keys()) {
                socket.close();
            }
            wss.close();
            void redisBus.shutdown();
        }
    };
}
