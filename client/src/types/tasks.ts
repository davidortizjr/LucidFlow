export type Project = {
    id: string;
    name: string;
    description?: string;
    status?: string;
    teamId?: string;
    createdAt?: string;
};

export type Board = {
    id: string;
    name: string;
    projectId?: string;
    position?: number;
    tasks: Task[];
};

export type Task = {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    position?: number;
    boardId?: string;
    projectId?: string;
    assignedTo?: {
        id: string;
        name?: string;
        avatar?: string;
    } | null;
};
