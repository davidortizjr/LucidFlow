import express from 'express';
import { getDocumentation, getDocumentationById, createDocumentation } from '../controllers/documentationController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createDocumentationRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getDocumentation, prisma));
    router.get('/:id', bindPrisma(getDocumentationById, prisma));
    router.post('/', bindPrisma(createDocumentation, prisma));

    return router;
}
