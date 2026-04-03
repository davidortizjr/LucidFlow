export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

export type PaginationParams = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    pagination: PaginationParams;
};

export type ApiError = {
    statusCode: number;
    message: string;
    details?: unknown;
    timestamp: string;
};
