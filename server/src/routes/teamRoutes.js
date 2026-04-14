import express from 'express';
import { getTeams, getTeamById, addTeamMember } from '../controllers/teamController.js';
import {
    inviteTeamMember,
    getInvitesForTeam,
    verifyInvite,
    acceptInviteCode,
    cancelInvite
} from '../controllers/inviteController.js';
import { authenticateToken } from '../middleware/auth.js';
import { bindPrisma, bindPrismaWithOptions } from '../helpers/routeBinding.js';

export function createTeamRoutes(prisma, options = {}) {
    const router = express.Router();

    router.get('/', bindPrisma(getTeams, prisma));
    router.get('/:id', bindPrisma(getTeamById, prisma));
    router.post('/:id/members', authenticateToken, bindPrismaWithOptions(addTeamMember, prisma, options));
    router.post('/:id/invites', authenticateToken, bindPrisma(inviteTeamMember, prisma));
    router.get('/:id/invites', authenticateToken, bindPrisma(getInvitesForTeam, prisma));
    router.get('/invites/:code/verify', bindPrisma(verifyInvite, prisma));
    router.post('/invites/:code/accept', authenticateToken, bindPrisma(acceptInviteCode, prisma));
    router.delete('/invites/:code', authenticateToken, bindPrisma(cancelInvite, prisma));

    return router;
}
