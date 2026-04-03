import express from 'express';
import { getTeams, getTeamById } from '../controllers/teamController.js';

export function createTeamRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getTeams(req, res, prisma));
    router.get('/:id', (req, res) => getTeamById(req, res, prisma));

    return router;
}
