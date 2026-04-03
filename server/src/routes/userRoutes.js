import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';

export function createUserRoutes(prisma) {
    const router = express.Router();

    router.get('/', (req, res) => getUsers(req, res, prisma));
    router.get('/:id', (req, res) => getUserById(req, res, prisma));

    return router;
}
