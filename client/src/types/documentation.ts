export type Doc = {
    id: string;
    title: string;
    category: string;
    description?: string;
    content?: string;
    createdById?: string;
    createdBy?: { id: string; name: string; avatar?: string };
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    isPublished?: boolean;
    tags?: string[];
};
