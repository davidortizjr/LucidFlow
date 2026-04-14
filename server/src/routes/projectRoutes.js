import express from 'express';
import { getProjects, getProjectById, createProject } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';
import { bindPrisma, bindPrismaWithOptions } from '../helpers/routeBinding.js';

export function createProjectRoutes(prisma, options = {}) {
    const router = express.Router();

    router.get('/', bindPrisma(getProjects, prisma));
    router.get('/:id', bindPrisma(getProjectById, prisma));
    router.post('/', authenticateToken, bindPrismaWithOptions(createProject, prisma, options));

    return router;
}
