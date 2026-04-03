export async function getTasks(req, res, prisma) {
    try {
        const { page = 1, limit = 50, projectId, boardId, status, priority, assignedToId } = req.query;
        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100); // Max 100 per page

        const where = {};
        if (projectId) where.projectId = projectId;
        if (boardId) where.boardId = boardId;
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = assignedToId;

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    position: true,
                    dueDate: true,
                    boardId: true,
                    projectId: true,
                    assignedTo: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { position: 'asc' },
                skip,
                take
            }),
            prisma.task.count({ where })
        ]);

        res.json({
            data: tasks,
            pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getTaskById(req, res, prisma) {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                board: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                attachments: true
            }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createTask(req, res, prisma) {
    try {
        const { dueDate, ...otherData } = req.body;

        // Handle datetime-local format if provided
        const parseDateTime = (dateStr) => {
            if (!dateStr) return null;
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
            throw new Error(`Invalid date format: ${dateStr}`);
        };

        const data = {
            ...otherData,
            ...(dueDate && { dueDate: parseDateTime(dueDate) })
        };

        const task = await prisma.task.create({
            data,
            include: { assignedTo: { select: { id: true, name: true, avatar: true } }, board: { select: { id: true, name: true } } }
        });
        res.json(task);
    } catch (error) {
        console.error('POST task error:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateTask(req, res, prisma) {
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body,
            include: { assignedTo: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
