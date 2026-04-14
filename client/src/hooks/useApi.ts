import { useState, useEffect, useRef } from 'react';
import { CACHE_TTL_MS } from '../constants/api';
import { buildApiUrl } from '../config/runtimeEndpoints';

// Request cache to prevent duplicate API calls
const requestCache = new Map<string, { data: any; expiresAt: number }>();
const requestInFlight = new Map<string, Promise<any>>();

function unwrapApiData<T>(value: T): T {
    if (value && typeof value === 'object' && 'data' in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>).data as T;
    }

    return value;
}

function buildCacheKey(endpoint: string, requiresAuth: boolean) {
    if (!requiresAuth) {
        return endpoint;
    }

    const token = localStorage.getItem('token') || 'no-token';
    return `${endpoint}::auth::${token}`;
}

async function parseErrorResponse(response: Response, endpoint: string) {
    let message = `Failed to fetch ${endpoint}`;

    try {
        const body = await response.json();
        if (body?.error) {
            message = body.error;
        }
    } catch {
        // Ignore parse errors and keep fallback message
    }

    throw new Error(message);
}

// Generic fetch with caching
async function fetchWithCache(endpoint: string, forceRefresh = false, requiresAuth = false) {
    const cacheKey = buildCacheKey(endpoint, requiresAuth);
    const now = Date.now();
    const cached = requestCache.get(cacheKey);

    if (forceRefresh) {
        requestCache.delete(cacheKey);
    } else if (cached && cached.expiresAt > now) {
        return cached.data;
    }

    if (requestInFlight.has(cacheKey)) {
        return requestInFlight.get(cacheKey);
    }

    const promise = (async () => {
        try {
            const headers: Record<string, string> = {};
            if (requiresAuth) {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Authentication required');
                }
                headers.Authorization = `Bearer ${token}`;
            }

            const url = await buildApiUrl(endpoint);
            const response = await fetch(url, { headers });
            if (!response.ok) {
                await parseErrorResponse(response, endpoint);
            }

            const data = await response.json();
            requestCache.set(cacheKey, {
                data,
                expiresAt: Date.now() + CACHE_TTL_MS
            });
            return data;
        } finally {
            requestInFlight.delete(cacheKey);
        }
    })();

    requestInFlight.set(cacheKey, promise);
    return promise;
}

function useCachedResource<T>(endpoint: string | null, deps: any[] = [], initialData: T, enabled = true, requiresAuth = false) {
    const [data, setData] = useState<T>(initialData);
    const [loading, setLoading] = useState(Boolean(enabled && endpoint));
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const refetch = async (forceRefresh = true) => {
        if (!endpoint) return;

        try {
            setLoading(true);
            const next = await fetchWithCache(endpoint, forceRefresh, requiresAuth);
            if (isMounted.current) {
                setData(next as T);
                setError(null);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err.message : `Error fetching ${endpoint}`);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;

        if (!enabled || !endpoint) {
            setLoading(false);
            setError(null);
            setData(initialData);
            return () => {
                isMounted.current = false;
            };
        }

        setLoading(true);

        (async () => {
            try {
                const next = await fetchWithCache(endpoint, false, requiresAuth);
                if (isMounted.current) {
                    setData(next as T);
                    setError(null);
                }
            } catch (err) {
                if (isMounted.current) {
                    setError(err instanceof Error ? err.message : `Error fetching ${endpoint}`);
                    setData(initialData);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            isMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, enabled, requiresAuth, ...deps]);

    return { data, loading, error, refetch };
}

export function useUsers() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/users', [], []);
    const usersArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { users: usersArray, loading, error, refetch };
}

export function useTeams() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/teams', [], []);
    const teamsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { teams: teamsArray, loading, error, refetch };
}

export function useProjects() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/projects', [], []);
    const projectsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { projects: projectsArray, loading, error, refetch };
}

export function useBoards(projectId?: string) {
    const endpoint = projectId ? `/projects/${projectId}/boards` : null;
    const { data, loading, error, refetch } = useCachedResource<any[]>(endpoint, [projectId], [], Boolean(projectId));
    const boardsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { boards: boardsArray, loading, error, refetch };
}

export function useTasks() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/tasks', [], []);
    const tasksArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { tasks: tasksArray, loading, error, refetch };
}

export function useChannels() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/channels', [], []);
    const channelsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { channels: channelsArray, loading, error, refetch };
}

export function useMessages(channelId?: string, conversationId?: string, options?: { enabled?: boolean }) {
    const params = new URLSearchParams();
    if (channelId) params.set('channelId', channelId);
    if (conversationId) params.set('conversationId', conversationId);

    const endpoint = params.toString() ? `/messages?${params.toString()}` : '/messages';
    const enabled = options?.enabled ?? true;
    const { data, loading, error, refetch } = useCachedResource<any[]>(endpoint, [channelId, conversationId], [], enabled, true);

    // Handle both array and paginated object formats
    const messagesArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { messages: messagesArray, loading, error, refetch };
}

export function useCalendarEvents() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/calendar-events', [], []);
    const eventsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { events: eventsArray, loading, error, refetch };
}

export function useTimeRecords() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/time-records', [], []);
    const recordsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { records: recordsArray, loading, error, refetch };
}

export function useDocumentation(includeContent = true) {
    const endpoint = includeContent ? '/documentation' : '/documentation?summary=true';
    const { data, loading, error, refetch } = useCachedResource<any[]>(endpoint, [includeContent], []);
    const docsArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { docs: docsArray, loading, error, refetch };
}

export function useDocumentationSummaries() {
    return useDocumentation(false);
}

export function useDocumentationById(docId?: string) {
    const endpoint = docId ? `/documentation/${docId}` : null;
    const { data, loading, error } = useCachedResource<any | null>(endpoint, [docId], null, Boolean(docId));
    const doc = (data as any)?.data ?? data;
    return { doc, loading, error };
}

export function useActivities() {
    const { data, loading, error } = useCachedResource<any[]>('/activities', [], []);
    const activitiesArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { activities: activitiesArray, loading, error };
}

// Optimized hook for TeamPage - fetches users and teams in parallel with caching
export function useTeamDirectory() {
    const [users, setUsers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        (async () => {
            try {
                // Fetch both in parallel for faster load
                const [usersData, teamsData] = await Promise.all([
                    fetchWithCache('/users'),
                    fetchWithCache('/teams')
                ]);

                if (isMounted.current) {
                    setUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
                    setTeams(Array.isArray(teamsData) ? teamsData : teamsData?.data || []);
                    setError(null);
                }
            } catch (err) {
                if (isMounted.current) {
                    setError(err instanceof Error ? err.message : 'Error fetching team directory');
                    setUsers([]);
                    setTeams([]);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            isMounted.current = false;
        };
    }, []);

    return { users, teams, loading, error };
}

export function useDashboard() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        (async () => {
            try {
                const [projects, users, events, activities] = await Promise.all([
                    fetchWithCache('/projects'),
                    fetchWithCache('/users'),
                    fetchWithCache('/calendar-events'),
                    fetchWithCache('/activities')
                ]);

                if (isMounted.current) {
                    setDashboardData({
                        projects: unwrapApiData(projects),
                        users: unwrapApiData(users),
                        events: unwrapApiData(events),
                        activities: unwrapApiData(activities)
                    });
                    setError(null);
                }
            } catch (err) {
                if (isMounted.current) {
                    setError(err instanceof Error ? err.message : 'Error fetching dashboard data');
                    setDashboardData(null);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        projects: dashboardData?.projects || [],
        users: dashboardData?.users || [],
        events: dashboardData?.events || [],
        activities: dashboardData?.activities || [],
        loading,
        error
    };
}
