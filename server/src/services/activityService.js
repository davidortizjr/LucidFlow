export async function listActivities(prisma, query = {}) {
    const { projectId, userId, page = 1, limit = 50 } = query;
    const parsedPage = Math.max(1, Number.parseInt(String(page), 10));
    const parsedLimit = Math.min(Number.parseInt(String(limit), 10), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    const [activities, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            select: {
                id: true,
                type: true,
                description: true,
                createdAt: true,
                user: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parsedLimit
        }),
        prisma.activityLog.count({ where })
    ]);

    return {
        activities,
        pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            pages: Math.ceil(total / parsedLimit)
        }
    };
}
