import express from 'express';
import { getTasks, getTaskById, createTask, updateTask } from '../controllers/taskController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createTaskRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getTasks, prisma));
    router.get('/:id', bindPrisma(getTaskById, prisma));
    router.post('/', bindPrisma(createTask, prisma));
    router.patch('/:id', bindPrisma(updateTask, prisma));

    return router;
}
