import { requireAuthUserId, requireFields, sendError, sendSuccess } from '../helpers/response.js';
import {
    createTeamInvite as createInvite,
    getTeamInvites,
    getInviteByCode,
    acceptTeamInvite as acceptInvite,
    cancelTeamInvite
} from '../services/inviteService.js';

export async function inviteTeamMember(req, res, prisma) {
    try {
        const authenticatedUserId = requireAuthUserId(req);
        const teamId = req.params.id;
        const { email } = req.body;

        requireFields({ email }, ['email']);

        const invite = await createInvite(prisma, {
            email,
            teamId,
            invitedBy: authenticatedUserId
        });

        // TODO: Send invitation email with code to invited email address
        // For now, we'll just return the code in the response
        return sendSuccess(res, {
            id: invite.id,
            email: invite.email,
            code: invite.code,
            teamName: invite.team.name,
            senderName: invite.sender.name,
            expiresAt: invite.expiresAt,
            message: 'Invitation created successfully. The recipient will need to use the code to join the team.'
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getInvitesForTeam(req, res, prisma) {
    try {
        const teamId = req.params.id;
        requireAuthUserId(req);

        const invites = await getTeamInvites(prisma, teamId);

        return sendSuccess(res, invites);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function verifyInvite(req, res, prisma) {
    try {
        const { code } = req.params;

        const invite = await getInviteByCode(prisma, code);

        return sendSuccess(res, {
            code: invite.code,
            email: invite.email,
            teamName: invite.team.name,
            senderName: invite.sender.name,
            expiresAt: invite.expiresAt
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function acceptInviteCode(req, res, prisma) {
    try {
        const authenticatedUserId = requireAuthUserId(req);
        const { code } = req.params;

        const updatedInvite = await acceptInvite(prisma, {
            code,
            userId: authenticatedUserId
        });

        return sendSuccess(res, {
            message: `Successfully joined ${updatedInvite.team.name}`,
            teamId: updatedInvite.teamId,
            teamName: updatedInvite.team.name
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function cancelInvite(req, res, prisma) {
    try {
        const authenticatedUserId = requireAuthUserId(req);
        const { code } = req.params;

        // Verify that the authenticated user is authorized to cancel this invite
        const invite = await getInviteByCode(prisma, code);

        if (invite.invitedBy !== authenticatedUserId) {
            throw new Error('Unauthorized to cancel this invite');
        }

        const updatedInvite = await cancelTeamInvite(prisma, code);

        return sendSuccess(res, {
            message: 'Invite cancelled successfully',
            code: updatedInvite.code
        });
    } catch (error) {
        return sendError(res, error);
    }
}
