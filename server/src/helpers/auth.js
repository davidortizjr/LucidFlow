import bcryptjs from 'bcryptjs';

// Verify password against hashed password
export async function verifyPassword(password, hashedPassword) {
    try {
        return await bcryptjs.compare(password, hashedPassword);
    } catch (error) {
        throw new Error(`Password verification failed: ${error.message}`);
    }
}

// Hash a password
export async function hashPassword(password, saltRounds = 10) {
    try {
        return await bcryptjs.hash(password, saltRounds);
    } catch (error) {
        throw new Error(`Password hashing failed: ${error.message}`);
    }
}

// Generate a simple token (in production use JWT)
export function generateToken(userId) {
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}

// Verify token format
export function verifyTokenFormat(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        return decoded.includes(':');
    } catch {
        return false;
    }
}
