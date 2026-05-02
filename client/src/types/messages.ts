export type User = {
    id: string;
    name: string;
    avatar?: string;
    status?: string;
};

export type Channel = {
    id: string;
    name: string;
    description?: string;
    members?: Array<{ id: string }>;
};

export type Message = {
    id: string;
    content: string;
    createdAt: string;
    channelId?: string | null;
    conversationId?: string | null;
    conversation?: {
        participantIds?: string[];
    } | null;
    user?: {
        id: string;
        name?: string;
        avatar?: string;
    };
    // Optimistic rendering state
    _status?: 'sending' | 'sent' | 'delivered';
    _tempId?: string; // Temporary ID for pending messages
};

export type Conversation = {
    id: string;
    participantIds: string[];
    lastMessage?: Message;
    updatedAt: string;
};
