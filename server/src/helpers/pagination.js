// Parse pagination parameters from request
export function parsePaginationParams(page, limit, defaultLimit = 50, maxLimit = 100) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.min(parseInt(limit) || defaultLimit, maxLimit);
    const skip = (pageNum - 1) * pageLimit;

    return { pageNum, pageLimit, skip };
}

// Create pagination metadata
export function createPaginationMeta(pageNum, pageLimit, total) {
    return {
        page: pageNum,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit)
    };
}

// Format paginated response
export function formatPaginatedResponse(data, pageNum, pageLimit, total) {
    return {
        data,
        pagination: createPaginationMeta(pageNum, pageLimit, total)
    };
}

// Check if pagination is requested
export function isPaginationRequested(page, limit) {
    return !!(page || limit);
}
