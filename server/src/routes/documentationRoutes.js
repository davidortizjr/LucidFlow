import express from 'express';
import { getDocumentation, getDocumentationById, createDocumentation } from '../controllers/documentationController.js';

export function createDocumentationRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getDocumentation(req, res, prisma));
    router.get('/:id', (req, res) => getDocumentationById(req, res, prisma));
    router.post('/', (req, res) => createDocumentation(req, res, prisma));

    return router;
}
