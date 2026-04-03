// Validate message data
export function validateMessageInput(content, type, userId, channelId, conversationId) {
    const errors = [];

    if (!content || content.trim().length === 0) {
        errors.push('Message content is required');
    }

    if (!type) {
        errors.push('Message type is required');
    }

    if (!userId) {
        errors.push('User ID is required');
    }

    // Must have either channelId OR conversationId, not both or neither
    if ((channelId && conversationId) || (!channelId && !conversationId)) {
        errors.push('Message must have either channelId (for channels) or conversationId (for direct messages), but not both');
    }

    return errors;
}

// Build where clause for message queries
export function buildMessageWhereClause(channelId, conversationId) {
    const where = {};

    if (channelId) {
        where.channelId = channelId;
        where.conversationId = null;
    } else if (conversationId) {
        where.conversationId = conversationId;
        where.channelId = null;
    } else {
        // Default: return all direct messages
        where.channelId = null;
        where.conversationId = { not: null };
    }

    return where;
}

// Format message response
export function formatMessageResponse(message) {
    return {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        channelId: message.channelId,
        conversationId: message.conversationId,
        user: message.user ? {
            id: message.user.id,
            name: message.user.name,
            avatar: message.user.avatar
        } : null
    };
}
