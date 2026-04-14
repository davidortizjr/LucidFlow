import { requireAuthUserId, requireFields, sendError, sendSuccess } from '../helpers/response.js';
import {
    addTeamMemberWithActivity,
    getTeamById as findTeamById,
    listTeams
} from '../services/teamService.js';

export async function getTeams(req, res, prisma) {
    try {
        const teams = await listTeams(prisma);
        return sendSuccess(res, teams);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getTeamById(req, res, prisma) {
    try {
        const team = await findTeamById(prisma, req.params.id);
        return sendSuccess(res, team);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function addTeamMember(req, res, prisma, options = {}) {
    try {
        const authenticatedUserId = requireAuthUserId(req);

        const teamId = req.params.id;
        const { userId, projectId } = req.body;
        requireFields({ userId }, ['userId']);

        const result = await addTeamMemberWithActivity(prisma, {
            authenticatedUserId,
            teamId,
            userId,
            projectId
        }, {
            onActivityCreated: options.onActivityCreated
        });

        return sendSuccess(res, result);
    } catch (error) {
        return sendError(res, error);
    }
}
