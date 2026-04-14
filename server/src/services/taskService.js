import { HttpError } from '../helpers/response.js';

function parseDateTime(dateStr) {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }
    throw new HttpError(`Invalid date format: ${dateStr}`, 400, 'VALIDATION_ERROR');
}

export async function listTasks(prisma, query = {}) {
    const { page = 1, limit = 50, projectId, boardId, status, priority, assignedToId } = query;
    const parsedPage = Math.max(1, Number.parseInt(String(page), 10));
    const parsedLimit = Math.min(Number.parseInt(String(limit), 10), 100);
    const skip = (parsedPage - 1) * parsedLimit;

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
            take: parsedLimit
        }),
        prisma.task.count({ where })
    ]);

    return {
        tasks,
        pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            pages: Math.ceil(total / parsedLimit)
        }
    };
}

export async function getTaskById(prisma, taskId) {
    return prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignedTo: { select: { id: true, name: true, avatar: true } },
            board: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
            comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            attachments: true
        }
    });
}

export async function createTask(prisma, input) {
    const { dueDate, ...otherData } = input;

    const data = {
        ...otherData,
        ...(dueDate && { dueDate: parseDateTime(dueDate) })
    };

    return prisma.task.create({
        data,
        include: {
            assignedTo: { select: { id: true, name: true, avatar: true } },
            board: { select: { id: true, name: true } }
        }
    });
}

export async function updateTask(prisma, taskId, input) {
    return prisma.task.update({
        where: { id: taskId },
        data: input,
        include: { assignedTo: { select: { id: true, name: true, avatar: true } } }
    });
}
