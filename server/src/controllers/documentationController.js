import { sendError, sendSuccess } from '../helpers/response.js';
import {
    createDocumentation as createDocumentationRecord,
    getDocumentationById as findDocumentationById,
    listDocumentation
} from '../services/documentationService.js';

export async function getDocumentation(req, res, prisma) {
    try {
        const summaryOnly = req.query.summary === 'true';
        const docs = await listDocumentation(prisma, summaryOnly);
        return sendSuccess(res, docs);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function getDocumentationById(req, res, prisma) {
    try {
        const doc = await findDocumentationById(prisma, req.params.id);
        return sendSuccess(res, doc);
    } catch (error) {
        return sendError(res, error);
    }
}

export async function createDocumentation(req, res, prisma) {
    try {
        const doc = await createDocumentationRecord(prisma, req.body);
        return sendSuccess(res, doc);
    } catch (error) {
        return sendError(res, error);
    }
}
