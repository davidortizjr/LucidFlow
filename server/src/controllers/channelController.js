import { sendError, sendSuccess } from '../helpers/response.js';
import { getChannelById as findChannelById, listChannels } from '../services/channelService.js';

export async function getChannels(req, res, prisma) {
    try {
        const channels = await listChannels(prisma);
        return sendSuccess(res, channels);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getChannelById(req, res, prisma) {
    try {
        const channel = await findChannelById(prisma, req.params.id);
        return sendSuccess(res, channel);
    } catch (error) {
        return sendError(res, error);
    }
}
