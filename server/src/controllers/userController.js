import { sendError, sendSuccess } from '../helpers/response.js';
import { getUserById as findUserById, listUsers } from '../services/userService.js';

export async function getUsers(req, res, prisma) {
    try {
        const users = await listUsers(prisma);
        return sendSuccess(res, users);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getUserById(req, res, prisma) {
    try {
        const user = await findUserById(prisma, req.params.id);
        return sendSuccess(res, user);
    } catch (error) {
        return sendError(res, error);
    }
}
