import express from 'express';
import { getProjects, getProjectById } from '../controllers/projectController.js';

export function createProjectRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getProjects(req, res, prisma));
    router.get('/:id', (req, res) => getProjectById(req, res, prisma));

    return router;
}
