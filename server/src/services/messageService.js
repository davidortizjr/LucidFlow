import { HttpError } from '../helpers/response.js';

async function ensureConversationForDirectMessage(prisma, senderId, recipientUserId) {
    if (!recipientUserId || typeof recipientUserId !== 'string') {
        throw new HttpError('recipientUserId is required for a new direct message', 400, 'VALIDATION_ERROR');
    }

    if (recipientUserId === senderId) {
        throw new HttpError('Cannot message yourself', 400, 'VALIDATION_ERROR');
    }

    const recipient = await prisma.user.findUnique({
        where: { id: recipientUserId },
        select: { id: true }
    });

    if (!recipient) {
        throw new HttpError('Recipient user not found', 404, 'NOT_FOUND');
    }

    const normalizedParticipantIds = [senderId, recipientUserId].sort();

    const existing = await prisma.conversation.findFirst({
        where: {
            participantIds: {
                array_contains: normalizedParticipantIds
            }
        },
        select: { id: true }
    });

    if (existing) {
        return existing.id;
    }

    const created = await prisma.conversation.create({
        data: {
            participantIds: normalizedParticipantIds
        },
        select: { id: true }
    });

    return created.id;
}

const messageSelect = {
    id: true,
    content: true,
    type: true,
    createdAt: true,
    channelId: true,
    conversationId: true,
    conversation: { select: { participantIds: true } },
    user: { select: { id: true, name: true, avatar: true } }
};

export async function listMessages(prisma, input) {
    const {
        channelId,
        conversationId,
        page,
        limit,
        authenticatedUserId
    } = input;

    const where = {};

    if (channelId) {
        where.channelId = channelId;
        where.conversationId = null;
        where.channel = {
            members: {
                some: {
                    id: authenticatedUserId
                }
            }
        };
    } else if (conversationId) {
        where.conversationId = conversationId;
        where.channelId = null;
        where.conversation = {
            participantIds: {
                array_contains: [authenticatedUserId]
            }
        };
    } else {
        where.channelId = null;
        where.conversationId = {
            not: null
        };
        where.conversation = {
            participantIds: {
                array_contains: [authenticatedUserId]
            }
        };
    }

    const hasPagination = Boolean(page || limit);
    if (!hasPagination) {
        const messages = await prisma.message.findMany({
            where,
            select: messageSelect,
            orderBy: { createdAt: 'asc' }
        });

        return { messages, pagination: null };
    }

    const pageNum = Math.max(1, Number.parseInt(page || '1', 10));
    const pageLimit = Math.min(Number.parseInt(limit || '50', 10), 100);
    const skip = (pageNum - 1) * pageLimit;

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where,
            select: messageSelect,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageLimit
        }),
        prisma.message.count({ where })
    ]);

    return {
        messages: messages.reverse(),
        pagination: {
            page: pageNum,
            limit: pageLimit,
            total,
            pages: Math.ceil(total / pageLimit)
        }
    };
}

export async function createMessageForUser(prisma, input, options = {}) {
    const {
        content,
        type,
        channelId,
        conversationId,
        recipientUserId,
        authenticatedUserId
    } = input;
    const { onMessageCreated } = options;

    if (!content || typeof content !== 'string' || !content.trim()) {
        throw new HttpError('Message cannot be empty', 400, 'VALIDATION_ERROR');
    }

    if (channelId) {
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                members: {
                    some: {
                        id: authenticatedUserId
                    }
                }
            },
            select: { id: true }
        });

        if (!channel) {
            throw new HttpError('Not authorized to post in this channel', 403, 'FORBIDDEN');
        }
    }

    let resolvedConversationId = conversationId || null;

    if (!channelId && !resolvedConversationId && recipientUserId) {
        resolvedConversationId = await ensureConversationForDirectMessage(prisma, authenticatedUserId, recipientUserId);
    }

    if (resolvedConversationId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: resolvedConversationId,
                participantIds: {
                    array_contains: [authenticatedUserId]
                }
            },
            select: { id: true }
        });

        if (!conversation) {
            throw new HttpError('Not authorized to post in this conversation', 403, 'FORBIDDEN');
        }
    }

    const message = await prisma.message.create({
        data: {
            content,
            type: type || 'TEXT',
            userId: authenticatedUserId,
            channelId: channelId || null,
            conversationId: resolvedConversationId
        },
        include: {
            user: { select: { id: true, name: true, avatar: true } },
            conversation: { select: { participantIds: true } }
        }
    });

    if (typeof onMessageCreated === 'function') {
        let directParticipantIds = [];

        if (!channelId && resolvedConversationId) {
            const conversation = await prisma.conversation.findUnique({
                where: { id: resolvedConversationId },
                select: { participantIds: true }
            });

            if (Array.isArray(conversation?.participantIds)) {
                directParticipantIds = conversation.participantIds.filter((id) => typeof id === 'string');
            }
        }

        await Promise.resolve(onMessageCreated(message, { directParticipantIds }));
    }

    return message;
}

export async function getMessageDebugCounts(prisma) {
    const [channelMessages, directMessages, orphaned] = await Promise.all([
        prisma.message.count({
            where: { channelId: { not: null }, conversationId: null }
        }),
        prisma.message.count({
            where: { conversationId: { not: null }, channelId: null }
        }),
        prisma.message.count({
            where: {
                OR: [
                    { channelId: null, conversationId: null },
                    { AND: [{ channelId: { not: null } }, { conversationId: { not: null } }] }
                ]
            }
        })
    ]);

    return {
        channelMessages,
        directMessages,
        orphanedOrInvalid: orphaned
    };
}
