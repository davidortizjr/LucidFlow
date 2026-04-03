import express from 'express';
import { getTasks, getTaskById, createTask, updateTask } from '../controllers/taskController.js';

export function createTaskRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getTasks(req, res, prisma));
    router.get('/:id', (req, res) => getTaskById(req, res, prisma));
    router.post('/', (req, res) => createTask(req, res, prisma));
    router.patch('/:id', (req, res) => updateTask(req, res, prisma));

    return router;
}
