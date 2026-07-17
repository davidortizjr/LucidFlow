import { HttpError } from '../helpers/response.js';

const MAX_STRING_LENGTH = 50000;
const MAX_ARRAY_LENGTH = 1000;
const MAX_OBJECT_KEYS = 2000;
const MAX_DEPTH = 12;
const MAX_TOTAL_NODES = 5000;

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const CONTROL_CHAR_PATTERN = /[\u0000]/g;

function isPlainObject(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function createValidationError(message, details = null) {
    throw new HttpError(message, 400, 'VALIDATION_ERROR', details);
}

function createPayloadTooLargeError(message, details = null) {
    throw new HttpError(message, 413, 'PAYLOAD_TOO_LARGE', details);
}

function sanitizeString(value, path) {
    if (value.length > MAX_STRING_LENGTH) {
        createPayloadTooLargeError(`Input is too large at ${path}`, {
            path,
            maxLength: MAX_STRING_LENGTH
        });
    }

    return value.replace(CONTROL_CHAR_PATTERN, '');
}

function sanitizeValue(value, path, state) {
    state.totalNodes += 1;

    if (state.totalNodes > MAX_TOTAL_NODES) {
        createPayloadTooLargeError('Request input is too large', {
            maxNodes: MAX_TOTAL_NODES
        });
    }

    if (value === null || value === undefined) {
        return value;
    }

    const valueType = typeof value;

    if (valueType === 'string') {
        return sanitizeString(value, path);
    }

    if (valueType === 'number' || valueType === 'boolean') {
        return value;
    }

    if (valueType === 'bigint' || valueType === 'symbol' || valueType === 'function') {
        createValidationError(`Unsupported input type at ${path}`, {
            path,
            type: valueType
        });
    }

    if (Array.isArray(value)) {
        if (value.length > MAX_ARRAY_LENGTH) {
            createPayloadTooLargeError(`Array is too large at ${path}`, {
                path,
                maxLength: MAX_ARRAY_LENGTH
            });
        }

        if (state.depth >= MAX_DEPTH) {
            createValidationError(`Input nesting is too deep at ${path}`, {
                path,
                maxDepth: MAX_DEPTH
            });
        }

        return value.map((item, index) => sanitizeValue(item, `${path}[${index}]`, {
            depth: state.depth + 1,
            totalNodes: state.totalNodes
        }));
    }

    if (!isPlainObject(value)) {
        createValidationError(`Unsupported input structure at ${path}`, {
            path,
            type: value.constructor?.name || 'unknown'
        });
    }

    if (state.depth >= MAX_DEPTH) {
        createValidationError(`Input nesting is too deep at ${path}`, {
            path,
            maxDepth: MAX_DEPTH
        });
    }

    const entries = Object.entries(value);

    if (entries.length > MAX_OBJECT_KEYS) {
        createPayloadTooLargeError(`Object is too large at ${path}`, {
            path,
            maxKeys: MAX_OBJECT_KEYS
        });
    }

    const sanitized = {};

    for (const [key, childValue] of entries) {
        if (key.length > 200) {
            createPayloadTooLargeError(`Input key is too large at ${path}.${key}`, {
                path: `${path}.${key}`,
                maxLength: 200
            });
        }

        if (DANGEROUS_KEYS.has(key)) {
            createValidationError(`Disallowed input key at ${path}.${key}`, {
                path: `${path}.${key}`,
                key
            });
        }

        sanitized[key] = sanitizeValue(childValue, `${path}.${key}`, {
            depth: state.depth + 1,
            totalNodes: state.totalNodes
        });
    }

    return sanitized;
}

function setRequestValue(req, key, value) {
    Object.defineProperty(req, key, {
        value,
        configurable: true,
        enumerable: true,
        writable: true
    });
}

export function sanitizeRequestInput(req, res, next) {
    try {
        if (req.body !== undefined) {
            setRequestValue(req, 'body', sanitizeValue(req.body, 'body', { depth: 0, totalNodes: 0 }));
        }

        if (req.query !== undefined) {
            setRequestValue(req, 'query', sanitizeValue(req.query, 'query', { depth: 0, totalNodes: 0 }));
        }

        if (req.params !== undefined) {
            setRequestValue(req, 'params', sanitizeValue(req.params, 'params', { depth: 0, totalNodes: 0 }));
        }

        next();
    } catch (error) {
        next(error);
    }
}
