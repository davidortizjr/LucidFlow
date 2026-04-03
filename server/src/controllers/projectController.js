export async function getProjects(req, res, prisma) {
    try {
        const { page, limit, status, teamId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (teamId) where.teamId = teamId;

        // If pagination params provided, return with pagination
        if (page || limit) {
            const pageNum = Math.max(1, parseInt(page) || 1);
            const pageLimit = Math.min(parseInt(limit) || 50, 100);
            const skip = (pageNum - 1) * pageLimit;

            const [projects, total] = await Promise.all([
                prisma.project.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        createdAt: true,
                        teamId: true,
                        _count: { select: { tasks: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: pageLimit
                }),
                prisma.project.count({ where })
            ]);

            return res.json({
                data: projects,
                pagination: { page: pageNum, limit: pageLimit, total, pages: Math.ceil(total / pageLimit) }
            });
        }

        // Default: return simple array
        const projects = await prisma.project.findMany({
            where,
            select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                teamId: true,
                _count: { select: { tasks: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getProjectById(req, res, prisma) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                team: { select: { id: true, name: true } },
                boards: { select: { id: true, name: true, position: true }, orderBy: { position: 'asc' } }
            }
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
