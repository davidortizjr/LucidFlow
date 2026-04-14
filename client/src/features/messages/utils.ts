import type { Message } from '../../types';

export function formatRelative(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export function dedupeAndSortMessages(messages: Message[]) {
    const byId = new Map<string, Message>();
    for (const message of messages) {
        byId.set(message.id, message);
    }

    return Array.from(byId.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function buildThreadKey(
    activeTab: 'direct' | 'channels',
    selectedChannelId: string,
    selectedConversationId?: string,
    selectedUserId?: string
) {
    if (activeTab === 'channels') {
        return `channel:${selectedChannelId || 'none'}`;
    }

    return `direct:${selectedConversationId || selectedUserId || 'none'}`;
}

export function computeLatestDirectTimestamps(messages: Message[], currentUserId?: string) {
    const map = new Map<string, number>();

    for (const message of messages) {
        const authorId = message.user?.id;
        if (!authorId || authorId === currentUserId) {
            continue;
        }

        const timestamp = new Date(message.createdAt).getTime();
        const previous = map.get(authorId) || 0;
        if (timestamp > previous) {
            map.set(authorId, timestamp);
        }
    }

    return map;
}

export function computeLatestChannelTimestamps(messages: Message[]) {
    const map = new Map<string, number>();

    for (const message of messages) {
        if (!message.channelId) {
            continue;
        }

        const timestamp = new Date(message.createdAt).getTime();
        const previous = map.get(message.channelId) || 0;
        if (timestamp > previous) {
            map.set(message.channelId, timestamp);
        }
    }

    return map;
}
