import 'dotenv/config.js';
import express from 'express';
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cors from 'cors';
import http from 'http';

const { PrismaClient } = pkg;

import { createAuthRoutes } from './routes/authRoutes.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createTeamRoutes } from './routes/teamRoutes.js';
import { createProjectRoutes } from './routes/projectRoutes.js';
import { createBoardRoutes, createTaskMovementRoutes } from './routes/boardRoutes.js';
import { createTaskRoutes } from './routes/taskRoutes.js';
import { createChannelRoutes } from './routes/channelRoutes.js';
import { createMessageRoutes } from './routes/messageRoutes.js';
import { createCalendarRoutes } from './routes/calendarRoutes.js';
import { createTimeTrackingRoutes } from './routes/timeTrackingRoutes.js';
import { createDocumentationRoutes } from './routes/documentationRoutes.js';
import { createActivityRoutes } from './routes/activityRoutes.js';
import { createNotificationRoutes } from './routes/notificationRoutes.js';
import { createHealthRoutes } from './routes/healthRoutes.js';
import { arcjetProtect } from './middleware/arcjet.js';
import { createMessagingWebSocketServer } from './services/websocketServer.js';
import { createMessageNotifications, createNotificationsFromActivity } from './services/notificationService.js';

const app = express();
const server = http.createServer(app);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());
app.use('/api/messages', arcjetProtect);

const messagingWs = createMessagingWebSocketServer({
    server,
    prisma,
    onMessageCreated: (message, context) => createMessageNotifications(prisma, message, context)
});

app.use('/api/auth', createAuthRoutes(prisma));

app.use('/api/users', createUserRoutes(prisma));

app.use('/api/teams', createTeamRoutes(prisma, {
    onActivityCreated: (activity) => createNotificationsFromActivity(prisma, activity)
}));

app.use('/api/projects', createProjectRoutes(prisma, {
    onActivityCreated: (activity) => createNotificationsFromActivity(prisma, activity)
}));

app.use('/api/projects/:projectId/boards', createBoardRoutes(prisma));

app.use('/api/tasks', createTaskMovementRoutes(prisma));

app.use('/api/tasks', createTaskRoutes(prisma));

app.use('/api/channels', createChannelRoutes(prisma));

app.use('/api/messages', createMessageRoutes(prisma, {
    onMessageCreated: async (message, context) => {
        messagingWs.broadcastMessage(message, context);
        await createMessageNotifications(prisma, message, context);
    }
}));

app.use('/api/calendar-events', createCalendarRoutes(prisma));

app.use('/api/time-records', createTimeTrackingRoutes(prisma));

app.use('/api/documentation', createDocumentationRoutes(prisma));

app.use('/api/activities', createActivityRoutes(prisma));

app.use('/api/notifications', createNotificationRoutes(prisma));

app.use('/api/health', createHealthRoutes());

const BASE_PORT = Number.parseInt(process.env.PORT || '3000', 10);
const MAX_PORT_ATTEMPTS = Number.parseInt(process.env.PORT_FALLBACK_ATTEMPTS || '10', 10);

function startServer(preferredPort, attemptsRemaining) {
    const onError = (error) => {
        server.off('error', onError);

        if (error.code === 'EADDRINUSE' && attemptsRemaining > 0) {
            const nextPort = preferredPort + 1;
            startServer(nextPort, attemptsRemaining - 1);
            return;
        }

        process.exit(1);
    };

    server.once('error', onError);
    server.listen(preferredPort);
}

startServer(BASE_PORT, Math.max(0, MAX_PORT_ATTEMPTS));

let shuttingDown = false;

async function shutdown() {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    messagingWs.shutdown();

    server.close(async () => {
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
    });
}

process.on('SIGTERM', () => {
    void shutdown();
});

process.on('SIGINT', () => {
    void shutdown();
});