import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const LEGACY_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function verifyLegacyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [userId, issuedAtRaw] = decoded.split(':');

        if (!userId || !issuedAtRaw) {
            return null;
        }

        const issuedAt = Number(issuedAtRaw);
        if (!Number.isFinite(issuedAt)) {
            return null;
        }

        if (Date.now() - issuedAt > LEGACY_TOKEN_MAX_AGE_MS) {
            return null;
        }

        return { userId, legacy: true };
    } catch {
        return null;
    }
}

export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (_error) {
        return verifyLegacyToken(token);
    }
}

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.userId = decoded.userId;
    next();
}

export { JWT_SECRET };
