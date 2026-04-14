import express from 'express';
import { login } from '../controllers/authController.js';
import { bindPrisma } from '../helpers/routeBinding.js';

export function createAuthRoutes(prisma) {
    const router = express.Router();

    router.post('/login', bindPrisma(login, prisma));

    return router;
}
