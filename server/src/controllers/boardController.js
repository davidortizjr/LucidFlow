import { sendError, sendSuccess } from '../helpers/response.js';
import { listBoardsByProject, moveTaskBetweenBoards } from '../services/boardService.js';

export async function getBoards(req, res, prisma) {
    try {
        const boards = await listBoardsByProject(prisma, req.params.projectId);
        return sendSuccess(res, boards);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function moveTask(req, res, prisma) {
    try {
        const updatedTask = await moveTaskBetweenBoards(prisma, req.params.id, req.body);
        return sendSuccess(res, updatedTask);
    } catch (error) {
        return sendError(res, error);
    }
}
