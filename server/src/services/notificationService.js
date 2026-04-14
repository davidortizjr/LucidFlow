export async function createNotifications(prisma, {
    recipientUserIds = [],
    type,
    title,
    description,
    metadata = null,
    excludeUserId = null
}) {
    if (!Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
        return;
    }

    const uniqueRecipients = [...new Set(recipientUserIds.filter((id) => typeof id === 'string' && id.length > 0))]
        .filter((id) => id !== excludeUserId);

    if (uniqueRecipients.length === 0) {
        return;
    }

    await prisma.notification.createMany({
        data: uniqueRecipients.map((userId) => ({
            userId,
            type,
            title,
            description,
            metadata
        }))
    });
}

export async function createMessageNotifications(prisma, message, context = {}) {
    const senderId = message.user?.id || message.userId;

    if (message.channelId) {
        const channel = await prisma.channel.findUnique({
            where: { id: message.channelId },
            select: {
                id: true,
                name: true,
                members: { select: { id: true } }
            }
        });

        if (!channel) {
            return;
        }

        const recipientUserIds = channel.members.map((member) => member.id);
        await createNotifications(prisma, {
            recipientUserIds,
            type: 'MESSAGE',
            title: `New message in #${channel.name}`,
            description: `${message.user?.name || 'Someone'}: ${message.content}`,
            metadata: {
                channelId: message.channelId,
                messageId: message.id,
                senderId
            },
            excludeUserId: senderId
        });
        return;
    }

    if (message.conversationId) {
        const participantIds = Array.isArray(context.directParticipantIds)
            ? context.directParticipantIds.filter((id) => typeof id === 'string')
            : [];

        await createNotifications(prisma, {
            recipientUserIds: participantIds,
            type: 'MESSAGE',
            title: `New direct message`,
            description: `${message.user?.name || 'Someone'}: ${message.content}`,
            metadata: {
                conversationId: message.conversationId,
                messageId: message.id,
                senderId
            },
            excludeUserId: senderId
        });
    }
}

export async function createNotificationsFromActivity(prisma, activity) {
    if (!activity || !activity.type || !activity.userId) {
        return;
    }

    if (activity.type !== 'USER_JOINED' && activity.type !== 'PROJECT_CREATED') {
        return;
    }

    let recipientUserIds = [];

    if (activity.projectId) {
        const project = await prisma.project.findUnique({
            where: { id: activity.projectId },
            select: {
                id: true,
                team: {
                    select: {
                        members: { select: { id: true } }
                    }
                }
            }
        });

        if (project?.team?.members) {
            recipientUserIds = project.team.members.map((member) => member.id);
        }
    }

    if (recipientUserIds.length === 0) {
        return;
    }

    const typeLabel = activity.type === 'USER_JOINED' ? 'Member joined' : 'Project created';
    await createNotifications(prisma, {
        recipientUserIds,
        type: 'ACTIVITY',
        title: typeLabel,
        description: activity.description || typeLabel,
        metadata: {
            activityId: activity.id,
            projectId: activity.projectId || null,
            type: activity.type,
            actorUserId: activity.userId
        },
        excludeUserId: activity.userId
    });
}

export async function getUserNotifications(prisma, input) {
    const {
        userId,
        includeRead = false,
        page = 1,
        limit = 20
    } = input;

    const safePage = Math.max(1, Number.parseInt(String(page), 10));
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10)));
    const skip = (safePage - 1) * safeLimit;

    const where = {
        userId,
        ...(includeRead ? {} : { isRead: false })
    };

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: safeLimit
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return {
        notifications,
        unreadCount,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit)
        }
    };
}

export async function markNotificationAsReadForUser(prisma, input) {
    const { userId, notificationId } = input;

    const existing = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true }
    });

    if (!existing) {
        return null;
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
    });
}

export async function markAllNotificationsAsReadForUser(prisma, userId) {
    const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });

    return result.count;
}
