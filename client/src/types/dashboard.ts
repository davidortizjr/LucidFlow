export type DashboardProject = {
    id: string;
    name?: string;
    status: string;
    tasks?: Array<unknown>;
};

export type DashboardUser = {
    id: string;
    name: string;
    avatar?: string;
};

export type DashboardEvent = {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
};

export type ActivityUser = {
    name?: string;
    avatar?: string;
};

export type DashboardActivity = {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user?: ActivityUser;
};
