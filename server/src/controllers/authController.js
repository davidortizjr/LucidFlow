import { sendError, sendSuccess } from '../helpers/response.js';
import { loginUser } from '../services/authService.js';

export async function login(req, res, prisma) {
    try {
        const result = await loginUser(prisma, req.body);
        return sendSuccess(res, result);
    } catch (error) {
        return sendError(res, error);
    }
}
