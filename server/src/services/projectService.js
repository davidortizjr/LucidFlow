import { HttpError } from '../helpers/response.js';

const projectListSelect = {
    id: true,
    name: true,
    status: true,
    createdAt: true,
    teamId: true,
    _count: { select: { tasks: true } }
};

export async function listProjects(prisma, query) {
    const { page, limit, status, teamId } = query;

    const where = {};
    if (status) where.status = status;
    if (teamId) where.teamId = teamId;

    if (!page && !limit) {
        const projects = await prisma.project.findMany({
            where,
            select: projectListSelect,
            orderBy: { createdAt: 'desc' }
        });

        return { projects, pagination: null };
    }

    const pageNum = Math.max(1, Number.parseInt(page || '1', 10));
    const pageLimit = Math.min(Number.parseInt(limit || '50', 10), 100);
    const skip = (pageNum - 1) * pageLimit;

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            select: projectListSelect,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageLimit
        }),
        prisma.project.count({ where })
    ]);

    return {
        projects,
        pagination: {
            page: pageNum,
            limit: pageLimit,
            total,
            pages: Math.ceil(total / pageLimit)
        }
    };
}

export async function getProjectById(prisma, projectId) {
    return prisma.project.findUnique({
        where: { id: projectId },
        include: {
            team: { select: { id: true, name: true } },
            boards: { select: { id: true, name: true, position: true }, orderBy: { position: 'asc' } }
        }
    });
}

export async function createProjectWithActivity(prisma, input, options = {}) {
    const {
        authenticatedUserId,
        name,
        description,
        teamId,
        status,
        startDate,
        endDate
    } = input;
    const { onActivityCreated } = options;

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
    if (!team) {
        throw new HttpError('Team not found', 404, 'NOT_FOUND');
    }

    const project = await prisma.project.create({
        data: {
            name,
            description: description || null,
            teamId,
            status: status || 'active',
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        },
        select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            teamId: true
        }
    });

    const actor = await prisma.user.findUnique({
        where: { id: authenticatedUserId },
        select: { name: true }
    });

    const activity = await prisma.activityLog.create({
        data: {
            type: 'PROJECT_CREATED',
            userId: authenticatedUserId,
            projectId: project.id,
            description: `${actor?.name || 'A user'} created project: ${project.name}`,
            metadata: JSON.stringify({ projectId: project.id })
        }
    });

    if (typeof onActivityCreated === 'function') {
        await Promise.resolve(onActivityCreated(activity));
    }

    return project;
}
