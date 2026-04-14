import { sendError, sendSuccess } from '../helpers/response.js';
import { listActivities } from '../services/activityService.js';

export async function getActivities(req, res, prisma) {
    try {
        const result = await listActivities(prisma, req.query);
        return sendSuccess(res, result.activities, {
            meta: { pagination: result.pagination }
        });
    } catch (error) {
        return sendError(res, error);
    }
}
