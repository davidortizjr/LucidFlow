import express from 'express';
import { login } from '../controllers/authController.js';

export function createAuthRoutes(prisma) {
    const router = express.Router();

    router.post('/login', (req, res) => login(req, res, prisma));

    return router;
}
