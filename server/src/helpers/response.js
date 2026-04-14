export class HttpError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export function sendSuccess(res, data, options = {}) {
    const {
        statusCode = 200,
        message = 'Success',
        meta = null
    } = options;

    return res.status(statusCode).json({
        success: true,
        message,
        data: data ?? null,
        ...(meta ? { meta } : {})
    });
}

export function sendError(res, error, options = {}) {
    const {
        statusCode: fallbackStatusCode = 500,
        message: fallbackMessage = 'An error occurred'
    } = options;

    const isHttpError = error instanceof HttpError;
    const statusCode = isHttpError ? error.statusCode : fallbackStatusCode;
    const errorMessage = error instanceof Error ? error.message : fallbackMessage;

    return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: errorMessage,
        code: isHttpError ? error.code : 'INTERNAL_ERROR',
        ...(isHttpError && error.details ? { details: error.details } : {})
    });
}

// Handle async endpoint errors
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Validate required fields
export function validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field]);
    return missingFields;
}

export function requireAuthUserId(req) {
    if (!req.userId) {
        throw new HttpError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    return req.userId;
}

export function requireFields(data, requiredFields) {
    const missingFields = validateRequiredFields(data, requiredFields);
    if (missingFields.length > 0) {
        throw new HttpError('Missing required fields', 400, 'VALIDATION_ERROR', {
            missingFields
        });
    }
}

export function requireExactlyOne(values, labelA, labelB, message = null) {
    const [a, b] = values;
    const hasA = Boolean(a);
    const hasB = Boolean(b);

    if ((hasA && hasB) || (!hasA && !hasB)) {
        throw new HttpError(
            message || `Exactly one of ${labelA} or ${labelB} is required`,
            400,
            'VALIDATION_ERROR'
        );
    }
}

// Create error response
export function createErrorResponse(statusCode, message, details = null) {
    return {
        statusCode,
        message,
        details,
        timestamp: new Date().toISOString()
    };
}
