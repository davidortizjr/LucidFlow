import express from 'express';
import { getBoards, moveTask } from '../controllers/boardController.js';

export function createBoardRoutes(prisma) {
    const router = express.Router({ mergeParams: true });

    router.get('/', (req, res) => getBoards(req, res, prisma));

    return router;
}

export function createTaskMovementRoutes(prisma) {
    const router = express.Router();

    router.patch('/:id/move', (req, res) => moveTask(req, res, prisma));

    return router;
}
