import {
    HttpError,
    requireAuthUserId,
    sendError,
    sendSuccess
} from '../helpers/response.js';
import {
    createMessageForUser,
    getMessageDebugCounts,
    listMessages
} from '../services/messageService.js';

export async function getMessages(req, res, prisma) {
    try {
        const { channelId, conversationId, page, limit } = req.query;
        const authenticatedUserId = requireAuthUserId(req);
        const result = await listMessages(prisma, {
            channelId,
            conversationId,
            page,
            limit,
            authenticatedUserId
        });

        return sendSuccess(res, result.messages, {
            ...(result.pagination ? { meta: { pagination: result.pagination } } : {})
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function createMessage(req, res, prisma, options = {}) {
    try {
        const { content, type, userId, channelId, conversationId, recipientUserId } = req.body;
        const authenticatedUserId = requireAuthUserId(req);

        const hasChannelTarget = Boolean(channelId);
        const hasDirectTarget = Boolean(conversationId || recipientUserId);

        if ((hasChannelTarget && hasDirectTarget) || (!hasChannelTarget && !hasDirectTarget)) {
            throw new HttpError(
                'Message must have either channelId (for channels) or conversationId/recipientUserId (for direct messages), but not both',
                400,
                'VALIDATION_ERROR'
            );
        }

        if (userId && userId !== authenticatedUserId) {
            throw new HttpError('Cannot send messages on behalf of another user', 403, 'FORBIDDEN');
        }

        const message = await createMessageForUser(prisma, {
            content,
            type,
            channelId,
            conversationId,
            recipientUserId,
            authenticatedUserId
        }, {
            onMessageCreated: options.onMessageCreated
        });

        return sendSuccess(res, message);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function debugMessageCount(req, res, prisma) {
    try {
        const counts = await getMessageDebugCounts(prisma);
        return sendSuccess(res, counts);
    } catch (error) {
        return sendError(res, error);
    }
}
