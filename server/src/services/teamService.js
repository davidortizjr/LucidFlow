import { HttpError } from '../helpers/response.js';

export async function listTeams(prisma) {
    return prisma.team.findMany({
        include: { members: { select: { id: true, name: true, avatar: true } } }
    });
}

export async function getTeamById(prisma, teamId) {
    return prisma.team.findUnique({
        where: { id: teamId },
        include: {
            members: { select: { id: true, name: true, avatar: true, role: true, status: true } },
            projects: true,
            channels: true
        }
    });
}

export async function addTeamMemberWithActivity(prisma, input, options = {}) {
    const {
        authenticatedUserId,
        teamId,
        userId,
        projectId
    } = input;
    const { onActivityCreated } = options;

    if (!authenticatedUserId) {
        throw new HttpError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const [team, user] = await Promise.all([
        prisma.team.findUnique({
            where: { id: teamId },
            include: { members: { select: { id: true } } }
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
    ]);

    if (!team) {
        throw new HttpError('Team not found', 404, 'NOT_FOUND');
    }
    if (!user) {
        throw new HttpError('User not found', 404, 'NOT_FOUND');
    }

    const alreadyMember = team.members.some((member) => member.id === userId);
    if (!alreadyMember) {
        await prisma.team.update({
            where: { id: teamId },
            data: { members: { connect: { id: userId } } }
        });
    }

    let resolvedProjectId = projectId || null;
    if (!resolvedProjectId) {
        const firstProject = await prisma.project.findFirst({
            where: { teamId },
            select: { id: true },
            orderBy: { createdAt: 'desc' }
        });
        resolvedProjectId = firstProject?.id || null;
    }

    const activity = await prisma.activityLog.create({
        data: {
            type: 'USER_JOINED',
            userId,
            projectId: resolvedProjectId,
            description: `${user.name} joined the team`,
            metadata: JSON.stringify({ teamId, userId })
        }
    });

    if (typeof onActivityCreated === 'function') {
        await Promise.resolve(onActivityCreated(activity));
    }

    return {
        teamId,
        userId,
        added: !alreadyMember
    };
}
