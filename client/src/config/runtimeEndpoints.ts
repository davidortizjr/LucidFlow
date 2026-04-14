import { API_BASE_URL, WS_BASE_URL } from '../constants/api';

const DEFAULT_BACKEND_PORTS = [3000, 3001, 3002, 3003, 3004, 3005];
const PROBE_TIMEOUT_MS = 1200;

let resolvedApiBaseUrl: string | null = null;
let resolvingPromise: Promise<string> | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error('Endpoint probe timed out'));
        }, timeoutMs);

        promise
            .then((value) => {
                window.clearTimeout(timeoutId);
                resolve(value);
            })
            .catch((error) => {
                window.clearTimeout(timeoutId);
                reject(error);
            });
    });
}

function buildCandidateApiBases() {
    const candidates = new Set<string>();

    if (API_BASE_URL) {
        candidates.add(API_BASE_URL);
    }

    const hostname = window.location.hostname || 'localhost';
    for (const port of DEFAULT_BACKEND_PORTS) {
        candidates.add(`http://${hostname}:${port}`);
    }

    return Array.from(candidates);
}

async function isApiHealthy(baseUrl: string) {
    const response = await withTimeout(
        fetch(`${baseUrl}/api/health`, {
            method: 'GET'
        }),
        PROBE_TIMEOUT_MS
    );

    return response.ok;
}

export async function resolveApiBaseUrl() {
    if (resolvedApiBaseUrl) {
        return resolvedApiBaseUrl;
    }

    if (!resolvingPromise) {
        resolvingPromise = (async () => {
            const candidates = buildCandidateApiBases();

            for (const candidate of candidates) {
                try {
                    const healthy = await isApiHealthy(candidate);
                    if (healthy) {
                        resolvedApiBaseUrl = candidate;
                        return candidate;
                    }
                } catch {
                    // Ignore failed probes and try next candidate.
                }
            }

            resolvedApiBaseUrl = API_BASE_URL;
            return resolvedApiBaseUrl;
        })();
    }

    return resolvingPromise;
}

export async function buildApiUrl(endpoint: string) {
    const baseUrl = await resolveApiBaseUrl();
    return `${baseUrl}/api${endpoint}`;
}

export async function resolveWsBaseUrl() {
    if (import.meta.env.VITE_WS_BASE_URL) {
        return WS_BASE_URL;
    }

    const apiBase = await resolveApiBaseUrl();
    return apiBase.replace(/^http/i, 'ws');
}
