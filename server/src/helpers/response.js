// Send success response
export function sendSuccess(res, data, statusCode = 200, message = 'Success') {
    return res.status(statusCode).json({
        success: true,
        message,
        data: data || null
    });
}

// Send error response
export function sendError(res, error, statusCode = 500, message = 'An error occurred') {
    const errorMessage = error instanceof Error ? error.message : message;
    return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message
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

// Create error response
export function createErrorResponse(statusCode, message, details = null) {
    return {
        statusCode,
        message,
        details,
        timestamp: new Date().toISOString()
    };
}
