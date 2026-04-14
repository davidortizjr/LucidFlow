import { HttpError } from '../helpers/response.js';

/**
 * Generate a random invitation code
 */
function generateInviteCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Create a team invite
 */
export async function createTeamInvite(prisma, { email, teamId, invitedBy }) {
    if (!email || !teamId || !invitedBy) {
        throw new HttpError(400, 'Email, teamId, and invitedBy are required');
    }

    if (!isValidEmail(email)) {
        throw new HttpError(400, 'Invalid email format');
    }

    // Check if team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
        throw new HttpError(404, 'Team not found');
    }

    // Check if user is already a team member
    const existingMember = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: { where: { email } } }
    });

    if (existingMember?.members.length > 0) {
        throw new HttpError(409, 'User is already a team member');
    }

    // Check if an active invite already exists
    const existingInvite = await prisma.teamInvite.findFirst({
        where: {
            email,
            teamId,
            status: 'pending',
            expiresAt: { gt: new Date() }
        }
    });

    if (existingInvite) {
        throw new HttpError(409, 'An active invite already exists for this email');
    }

    // Generate invite code
    const code = generateInviteCode();

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invite
    const invite = await prisma.teamInvite.create({
        data: {
            email,
            code,
            teamId,
            invitedBy,
            expiresAt
        },
        include: {
            team: { select: { id: true, name: true } },
            sender: { select: { id: true, name: true, email: true } }
        }
    });

    return invite;
}

/**
 * Get invites for a team
 */
export async function getTeamInvites(prisma, teamId) {
    const invites = await prisma.teamInvite.findMany({
        where: { teamId },
        include: {
            team: { select: { id: true, name: true } },
            sender: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return invites;
}

/**
 * Get invite by code
 */
export async function getInviteByCode(prisma, code) {
    const invite = await prisma.teamInvite.findUnique({
        where: { code },
        include: {
            team: { select: { id: true, name: true } },
            sender: { select: { id: true, name: true } }
        }
    });

    if (!invite) {
        throw new HttpError(404, 'Invite not found');
    }

    if (invite.status !== 'pending') {
        throw new HttpError(410, 'This invite has already been used or is no longer valid');
    }

    if (new Date() > invite.expiresAt) {
        throw new HttpError(410, 'This invite has expired');
    }

    return invite;
}

/**
 * Accept team invite and add user to team
 */
export async function acceptTeamInvite(prisma, { code, userId }) {
    const invite = await getInviteByCode(prisma, code);

    // Check if the user already exists in the team
    const existingMember = await prisma.team.findUnique({
        where: { id: invite.teamId },
        include: { members: { where: { id: userId } } }
    });

    if (existingMember?.members.length > 0) {
        throw new HttpError(409, 'User is already a team member');
    }

    // Add user to team
    await prisma.team.update({
        where: { id: invite.teamId },
        data: { members: { connect: { id: userId } } }
    });

    // Mark invite as accepted
    const updatedInvite = await prisma.teamInvite.update({
        where: { code },
        data: { status: 'accepted' },
        include: {
            team: { select: { id: true, name: true } },
            sender: { select: { id: true, name: true } }
        }
    });

    return updatedInvite;
}

/**
 * Cancel team invite
 */
export async function cancelTeamInvite(prisma, code) {
    const updatedInvite = await prisma.teamInvite.update({
        where: { code },
        data: { status: 'expired' },
        include: {
            team: { select: { id: true, name: true } },
            sender: { select: { id: true, name: true } }
        }
    });

    return updatedInvite;
}
