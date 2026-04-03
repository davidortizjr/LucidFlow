// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): boolean => {
    return password.length >= 8;
};

// Validate required field
export const isRequired = (value: string | number | null | undefined): boolean => {
    return value !== null && value !== undefined && value !== '';
};

// Validate minimum length
export const isMinLength = (value: string, minLength: number): boolean => {
    return value.length >= minLength;
};

// Validate maximum length
export const isMaxLength = (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
};

// Validate URL format
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Validate number range
export const isInRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
};
