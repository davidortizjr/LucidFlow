export type TeamUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatar?: string;
};

export type StatusStyle = {
    dotBgClass: string;
    textClass: string;
    label: string;
};

export type Team = {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    members: TeamUser[];
    createdAt?: string;
};
