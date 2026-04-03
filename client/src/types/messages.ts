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
    user?: {
        id: string;
        name?: string;
        avatar?: string;
    };
};

export type Conversation = {
    id: string;
    participantIds: string[];
    lastMessage?: Message;
    updatedAt: string;
};
