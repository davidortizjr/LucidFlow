import 'dotenv/config.js';
import express from 'express';
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cors from 'cors';

const { PrismaClient } = pkg;

// Import route factories
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
import { createHealthRoutes } from './routes/healthRoutes.js';

const app = express();

// Initialize database connection with adapter
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middleware
app.use(cors());
app.use(express.json());

// ==================== ROUTES ====================

// Authentication
app.use('/api/auth', createAuthRoutes(prisma));

// Users
app.use('/api/users', createUserRoutes(prisma));

// Teams
app.use('/api/teams', createTeamRoutes(prisma));

// Projects
app.use('/api/projects', createProjectRoutes(prisma));

// Boards (nested under projects)
app.use('/api/projects/:projectId/boards', createBoardRoutes(prisma));

// Task movement
app.use('/api/tasks', createTaskMovementRoutes(prisma));

// Tasks
app.use('/api/tasks', createTaskRoutes(prisma));

// Channels
app.use('/api/channels', createChannelRoutes(prisma));

// Messages
app.use('/api/messages', createMessageRoutes(prisma));

// Calendar Events
app.use('/api/calendar-events', createCalendarRoutes(prisma));

// Time Records
app.use('/api/time-records', createTimeTrackingRoutes(prisma));

// Documentation
app.use('/api/documentation', createDocumentationRoutes(prisma));

// Activities
app.use('/api/activities', createActivityRoutes(prisma));

// Health Check
app.use('/api/health', createHealthRoutes());

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
        await prisma.$disconnect();
        await pool.end();
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(async () => {
        await prisma.$disconnect();
        await pool.end();
        console.log('Server closed');
        process.exit(0);
    });
});