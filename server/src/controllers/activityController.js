export async function getActivities(req, res, prisma) {
    try {
        const { projectId, userId, page = 1, limit = 50 } = req.query;
        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100);

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
                take
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: activities,
            pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
