import { useState, useEffect, useRef } from 'react';
import { API_BASE, CACHE_TTL_MS } from '../constants/api';

// Request cache to prevent duplicate API calls
const requestCache = new Map<string, { data: any; expiresAt: number }>();
const requestInFlight = new Map<string, Promise<any>>();

// Generic fetch with caching
async function fetchWithCache(endpoint: string, forceRefresh = false) {
    const now = Date.now();
    const cached = requestCache.get(endpoint);

    if (forceRefresh) {
        requestCache.delete(endpoint);
    } else if (cached && cached.expiresAt > now) {
        return cached.data;
    }

    if (requestInFlight.has(endpoint)) {
        return requestInFlight.get(endpoint);
    }

    const promise = (async () => {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
            const data = await response.json();
            requestCache.set(endpoint, {
                data,
                expiresAt: Date.now() + CACHE_TTL_MS
            });
            return data;
        } finally {
            requestInFlight.delete(endpoint);
        }
    })();

    requestInFlight.set(endpoint, promise);
    return promise;
}

function useCachedResource<T>(endpoint: string | null, deps: any[] = [], initialData: T, enabled = true) {
    const [data, setData] = useState<T>(initialData);
    const [loading, setLoading] = useState(Boolean(enabled && endpoint));
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const refetch = async (forceRefresh = true) => {
        if (!endpoint) return;

        try {
            setLoading(true);
            const next = await fetchWithCache(endpoint, forceRefresh);
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
                const next = await fetchWithCache(endpoint);
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
    }, [endpoint, enabled, ...deps]);

    return { data, loading, error, refetch };
}

export function useUsers() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/users', [], []);
    return { users: data, loading, error, refetch };
}

export function useTeams() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/teams', [], []);
    return { teams: data, loading, error, refetch };
}

export function useProjects() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/projects', [], []);
    return { projects: data, loading, error, refetch };
}

export function useBoards(projectId?: string) {
    const endpoint = projectId ? `/projects/${projectId}/boards` : null;
    const { data, loading, error, refetch } = useCachedResource<any[]>(endpoint, [projectId], [], Boolean(projectId));
    return { boards: data, loading, error, refetch };
}

export function useTasks() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/tasks', [], []);
    return { tasks: data, loading, error, refetch };
}

export function useChannels() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/channels', [], []);
    return { channels: data, loading, error, refetch };
}

export function useMessages(channelId?: string, conversationId?: string, options?: { enabled?: boolean }) {
    const params = new URLSearchParams();
    if (channelId) params.set('channelId', channelId);
    if (conversationId) params.set('conversationId', conversationId);

    const endpoint = params.toString() ? `/messages?${params.toString()}` : '/messages';
    const enabled = options?.enabled ?? true;
    const { data, loading, error, refetch } = useCachedResource<any[]>(endpoint, [channelId, conversationId], [], enabled);

    // Handle both array and paginated object formats
    const messagesArray = Array.isArray(data) ? data : (data as any)?.data || [];
    return { messages: messagesArray, loading, error, refetch };
}

export function useCalendarEvents() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/calendar-events', [], []);
    return { events: data, loading, error, refetch };
}

export function useTimeRecords() {
    const { data, loading, error, refetch } = useCachedResource<any[]>('/time-records', [], []);
    return { records: data, loading, error, refetch };
}

export function useDocumentation(includeContent = true) {
    const endpoint = includeContent ? '/documentation' : '/documentation?summary=true';
    const { data, loading, error, refetch } = useCachedResource<any[]>(endpoint, [includeContent], []);
    return { docs: data, loading, error, refetch };
}

export function useDocumentationSummaries() {
    return useDocumentation(false);
}

export function useDocumentationById(docId?: string) {
    const endpoint = docId ? `/documentation/${docId}` : null;
    const { data, loading, error } = useCachedResource<any | null>(endpoint, [docId], null, Boolean(docId));
    return { doc: data, loading, error };
}

export function useActivities() {
    const { data, loading, error } = useCachedResource<any[]>('/activities', [], []);
    return { activities: data, loading, error };
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
                    setUsers(usersData);
                    setTeams(teamsData);
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
                        projects,
                        users,
                        events,
                        activities
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
