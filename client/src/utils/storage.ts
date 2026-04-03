// Get item from localStorage
export const getFromStorage = <T>(key: string, defaultValue: T | null = null): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

// Set item in localStorage
export const setToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save to localStorage: ${key}`, error);
    }
};

// Remove item from localStorage
export const removeFromStorage = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove from localStorage: ${key}`, error);
    }
};

// Clear all localStorage
export const clearStorage = (): void => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Failed to clear localStorage', error);
    }
};

// Check if localStorage is available
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
