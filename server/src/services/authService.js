import bcryptjs from 'bcryptjs';
import { HttpError } from '../helpers/response.js';
import { generateToken } from '../middleware/auth.js';

export async function loginUser(prisma, credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
        throw new HttpError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, password: true, role: true, avatar: true }
    });

    if (!user) {
        throw new HttpError('Invalid email or password', 401, 'AUTH_INVALID');
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
        throw new HttpError('Invalid email or password', 401, 'AUTH_INVALID');
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token
    };
}
