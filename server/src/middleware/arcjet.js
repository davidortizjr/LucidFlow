import arcjet, { shield, tokenBucket } from '@arcjet/node';

const hasArcjetConfig = Boolean(process.env.ARCJET_KEY);

const baseArcjet = hasArcjetConfig
    ? arcjet({
        key: process.env.ARCJET_KEY,
        environment: process.env.ARCJET_ENV || process.env.NODE_ENV || 'development',
        rules: [
            shield({ mode: 'LIVE' }),
            tokenBucket({ mode: 'LIVE', refillRate: 20, interval: 10, capacity: 40 })
        ]
    })
    : null;

function buildFingerprint(req) {
    return [
        req.ip || req.socket?.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown',
        req.userId || 'anonymous'
    ].join('::');
}

export async function arcjetProtect(req, res, next) {
    if (!baseArcjet) {
        return next();
    }

    try {
        const decision = await baseArcjet.protect(req, {
            requested: 1,
            fingerprint: buildFingerprint(req)
        });

        if (decision?.isDenied?.()) {
            return res.status(429).json({ error: 'Request blocked by security policy' });
        }

        return next();
    } catch (error) {
        return next(error);
    }
}

export async function arcjetProtectWebSocketUpgrade(req) {
    if (!baseArcjet) {
        return true;
    }

    const ip = req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const decision = await baseArcjet.protect(req, {
        requested: 1,
        fingerprint: [ip, userAgent].join('::')
    });

    return !decision?.isDenied?.();
}
