export async function getMessages(req, res, prisma) {
    try {
        const { channelId, conversationId, page, limit } = req.query;

        // Build where clause - ensure channels and direct messages never mix
        const where = {};

        if (channelId) {
            // Channel messages: must have channelId, must NOT have conversationId
            where.channelId = channelId;
            where.conversationId = null;
        } else if (conversationId) {
            // Direct messages: must have conversationId, must NOT have channelId
            where.conversationId = conversationId;
            where.channelId = null;
        } else {
            // Default: return all direct messages (conversationId present, channelId absent)
            where.channelId = null;
            where.conversationId = {
                not: null
            };
        }

        // If pagination params provided, return with pagination
        if (page || limit) {
            const pageNum = Math.max(1, parseInt(page) || 1);
            const pageLimit = Math.min(parseInt(limit) || 50, 100);
            const skip = (pageNum - 1) * pageLimit;

            const [messages, total] = await Promise.all([
                prisma.message.findMany({
                    where,
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        createdAt: true,
                        channelId: true,
                        conversationId: true,
                        user: { select: { id: true, name: true, avatar: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: pageLimit
                }),
                prisma.message.count({ where })
            ]);

            return res.json({
                data: messages.reverse(),
                pagination: { page: pageNum, limit: pageLimit, total, pages: Math.ceil(total / pageLimit) }
            });
        }

        // Default: return simple array
        const messages = await prisma.message.findMany({
            where,
            select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                channelId: true,
                conversationId: true,
                user: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createMessage(req, res, prisma) {
    try {
        const { content, type, userId, channelId, conversationId } = req.body;

        // Validate: messages must have either channelId OR conversationId, not both
        if ((channelId && conversationId) || (!channelId && !conversationId)) {
            return res.status(400).json({
                error: 'Message must have either channelId (for channels) or conversationId (for direct messages), but not both'
            });
        }

        const message = await prisma.message.create({
            data: { content, type, userId, channelId, conversationId },
            include: { user: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function debugMessageCount(req, res, prisma) {
    try {
        const channelMessages = await prisma.message.count({
            where: { channelId: { not: null }, conversationId: null }
        });
        const directMessages = await prisma.message.count({
            where: { conversationId: { not: null }, channelId: null }
        });
        const orphaned = await prisma.message.count({
            where: {
                OR: [
                    { channelId: null, conversationId: null },
                    { AND: [{ channelId: { not: null } }, { conversationId: { not: null } }] }
                ]
            }
        });

        res.json({
            channelMessages,
            directMessages,
            orphanedOrInvalid: orphaned
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
