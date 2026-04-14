import { requireAuthUserId, requireFields, sendError, sendSuccess } from '../helpers/response.js';
import {
    createProjectWithActivity,
    getProjectById as findProjectById,
    listProjects
} from '../services/projectService.js';

export async function getProjects(req, res, prisma) {
    try {
        const result = await listProjects(prisma, req.query);

        return sendSuccess(res, result.projects, {
            ...(result.pagination ? { meta: { pagination: result.pagination } } : {})
        });
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getProjectById(req, res, prisma) {
    try {
        const project = await findProjectById(prisma, req.params.id);
        return sendSuccess(res, project);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function createProject(req, res, prisma, options = {}) {
    try {
        const authenticatedUserId = requireAuthUserId(req);

        const { name, description, teamId, status, startDate, endDate } = req.body;
        requireFields({ name, teamId }, ['name', 'teamId']);

        const project = await createProjectWithActivity(prisma, {
            authenticatedUserId,
            name,
            description,
            teamId,
            status,
            startDate,
            endDate
        }, {
            onActivityCreated: options.onActivityCreated
        });

        return sendSuccess(res, project, { statusCode: 201 });
    } catch (error) {
        return sendError(res, error);
    }
}
