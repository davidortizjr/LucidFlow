import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createUserRoutes(prisma) {
    const router = express.Router();

    router.get('/', bindPrisma(getUsers, prisma));
    router.get('/:id', bindPrisma(getUserById, prisma));

    return router;
}
