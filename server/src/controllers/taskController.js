import { sendError, sendSuccess } from '../helpers/response.js';
import {
    createTask as createTaskRecord,
    getTaskById as findTaskById,
    listTasks,
    updateTask as updateTaskRecord
} from '../services/taskService.js';

export async function getTasks(req, res, prisma) {
    try {
        const result = await listTasks(prisma, req.query);
        return sendSuccess(res, result.tasks, {
            meta: { pagination: result.pagination }
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getTaskById(req, res, prisma) {
    try {
        const task = await findTaskById(prisma, req.params.id);
        return sendSuccess(res, task);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function createTask(req, res, prisma) {
    try {
        const task = await createTaskRecord(prisma, req.body);
        return sendSuccess(res, task);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function updateTask(req, res, prisma) {
    try {
        const task = await updateTaskRecord(prisma, req.params.id, req.body);
        return sendSuccess(res, task);
    } catch (error) {
        return sendError(res, error);
    }
}
