export const getFromStorage = <T>(key: string, defaultValue: T | null = null): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

export const setToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage write failures.
    }
};

export const removeFromStorage = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch {
        // Ignore storage remove failures.
    }
};

export const clearStorage = (): void => {
    try {
        localStorage.clear();
    } catch {
        // Ignore storage clear failures.
    }
};

export const isStorageAvailable = (): boolean => {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
};
