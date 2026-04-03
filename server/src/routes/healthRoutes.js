import express from 'express';
import { getHealth } from '../controllers/healthController.js';

export function createHealthRoutes() {
    const router = express.Router();

    router.get('/', getHealth);

    return router;
}
