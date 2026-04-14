import { sendError, sendSuccess } from '../helpers/response.js';
import {
    createTimeRecord as createTimeRecordEntry,
    listTimeRecords,
    updateTimeRecord as updateTimeRecordEntry
} from '../services/timeTrackingService.js';

export async function getTimeRecords(req, res, prisma) {
    try {
        const records = await listTimeRecords(prisma, req.query);
        return sendSuccess(res, records);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function createTimeRecord(req, res, prisma) {
    try {
        const record = await createTimeRecordEntry(prisma, req.body);
        return sendSuccess(res, record);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function updateTimeRecord(req, res, prisma) {
    try {
        const record = await updateTimeRecordEntry(prisma, req.params.id, req.body);
        return sendSuccess(res, record);
    } catch (error) {
        return sendError(res, error);
    }
}
