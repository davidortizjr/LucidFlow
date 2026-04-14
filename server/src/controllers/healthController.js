import { sendSuccess } from '../helpers/response.js';

export function getHealth(req, res) {
    return sendSuccess(res, { status: 'ok', timestamp: new Date() });
}
