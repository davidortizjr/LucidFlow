export type User = {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: string;
};

export type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
};

export type LoginFormData = {
    email: string;
    password: string;
};
