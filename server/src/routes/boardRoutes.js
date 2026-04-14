import express from 'express';
import { getBoards, moveTask } from '../controllers/boardController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createBoardRoutes(prisma) {
    const router = express.Router({ mergeParams: true });

    router.get('/', bindPrisma(getBoards, prisma));

    return router;
}

export function createTaskMovementRoutes(prisma) {
    const router = express.Router();

    router.patch('/:id/move', bindPrisma(moveTask, prisma));

    return router;
}
