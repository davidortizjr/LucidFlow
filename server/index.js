import 'dotenv/config.js';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cors from 'cors';
import bcryptjs from 'bcryptjs';
import { generateToken, authenticateToken } from './src/middleware/auth.js';

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

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

console.log('Registering authentication routes...');
// Register a new user
app.post('/api/auth/register', async (req, res) => {
    console.log('Register endpoint hit');
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
                role: 'MEMBER',
                isActive: true,
                status: 'online'
            },
            select: { id: true, email: true, name: true, role: true }
        });

        const token = generateToken(user.id);
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    console.log('Login endpoint hit with body:', req.body);
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user.id);
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };

        res.json({ user: userResponse, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, name: true, avatar: true, role: true, status: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    // Token cleanup happens on client side
    res.json({ message: 'Logged out successfully' });
});

// ==================== USERS ====================
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, avatar: true, role: true, status: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: { teams: true, tasks: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== TEAMS ====================
app.get('/api/teams', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: { members: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/teams/:id', async (req, res) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: req.params.id },
            include: {
                members: { select: { id: true, name: true, avatar: true, role: true, status: true } },
                projects: true,
                channels: true
            }
        });
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PROJECTS ====================
app.get('/api/projects', async (req, res) => {
    try {
        const { page, limit, status, teamId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (teamId) where.teamId = teamId;

        // If pagination params provided, return with pagination
        if (page || limit) {
            const pageNum = Math.max(1, parseInt(page) || 1);
            const pageLimit = Math.min(parseInt(limit) || 50, 100);
            const skip = (pageNum - 1) * pageLimit;

            const [projects, total] = await Promise.all([
                prisma.project.findMany({
                    where,
                    select: { id: true, name: true, status: true, createdAt: true, teamId: true },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: pageLimit
                }),
                prisma.project.count({ where })
            ]);

            return res.json({
                data: projects,
                pagination: { page: pageNum, limit: pageLimit, total, pages: Math.ceil(total / pageLimit) }
            });
        }

        // Default: return simple array
        const projects = await prisma.project.findMany({
            where,
            select: { id: true, name: true, status: true, createdAt: true, teamId: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                team: { select: { id: true, name: true } },
                boards: { select: { id: true, name: true, position: true }, orderBy: { position: 'asc' } }
            }
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== BOARDS ====================
app.get('/api/projects/:projectId/boards', async (req, res) => {
    try {
        const boards = await prisma.board.findMany({
            where: { projectId: req.params.projectId },
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        position: true,
                        dueDate: true,
                        assignedTo: { select: { id: true, name: true, avatar: true } }
                    },
                    orderBy: { position: 'asc' }
                }
            },
            orderBy: { position: 'asc' }
        });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Move task across boards or within board
app.patch('/api/tasks/:id/move', async (req, res) => {
    try {
        const {
            sourceBoardId,
            destinationBoardId,
            sourceIndex,
            destinationIndex,
            status
        } = req.body;

        const parsedDestinationIndex = Number.parseInt(String(destinationIndex), 10);
        if (!destinationBoardId || Number.isNaN(parsedDestinationIndex) || parsedDestinationIndex < 0) {
            return res.status(400).json({ error: 'destinationBoardId and valid destinationIndex are required' });
        }

        const allowedStatuses = new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']);
        const safeStatus = typeof status === 'string' && allowedStatuses.has(status) ? status : undefined;

        const movedTask = await prisma.task.findUnique({
            where: { id: req.params.id },
            select: { id: true, boardId: true, position: true, status: true }
        });

        if (!movedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const actualSourceBoardId = sourceBoardId || movedTask.boardId;
        const parsedSourceIndex = Number.isInteger(sourceIndex) ? sourceIndex : movedTask.position;

        await prisma.$transaction(async (tx) => {
            if (actualSourceBoardId === destinationBoardId) {
                const boardTasks = await tx.task.findMany({
                    where: { boardId: actualSourceBoardId },
                    orderBy: { position: 'asc' },
                    select: { id: true }
                });

                const taskIds = boardTasks.map((task) => task.id);
                const currentIndex = taskIds.indexOf(movedTask.id);
                if (currentIndex === -1) return;

                taskIds.splice(currentIndex, 1);
                const clampedDestination = Math.min(Math.max(parsedDestinationIndex, 0), taskIds.length);
                taskIds.splice(clampedDestination, 0, movedTask.id);

                await Promise.all(
                    taskIds.map((taskId, index) =>
                        tx.task.update({
                            where: { id: taskId },
                            data: {
                                position: index,
                                ...(taskId === movedTask.id && safeStatus ? { status: safeStatus } : {})
                            }
                        })
                    )
                );
                return;
            }

            const sourceTasks = await tx.task.findMany({
                where: { boardId: actualSourceBoardId, NOT: { id: movedTask.id } },
                orderBy: { position: 'asc' },
                select: { id: true }
            });

            const destinationTasks = await tx.task.findMany({
                where: { boardId: destinationBoardId, NOT: { id: movedTask.id } },
                orderBy: { position: 'asc' },
                select: { id: true }
            });

            const destinationIds = destinationTasks.map((task) => task.id);
            const clampedDestination = Math.min(Math.max(parsedDestinationIndex, 0), destinationIds.length);
            destinationIds.splice(clampedDestination, 0, movedTask.id);

            await Promise.all([
                ...sourceTasks.map((task, index) =>
                    tx.task.update({
                        where: { id: task.id },
                        data: { position: index }
                    })
                ),
                ...destinationIds.map((taskId, index) =>
                    tx.task.update({
                        where: { id: taskId },
                        data: {
                            boardId: destinationBoardId,
                            position: index,
                            ...(taskId === movedTask.id
                                ? { status: safeStatus || movedTask.status }
                                : {})
                        }
                    })
                )
            ]);

            // In case client sent stale sourceIndex, ensure source board has contiguous ordering.
            if (!Number.isInteger(parsedSourceIndex) || parsedSourceIndex < 0) {
                const normalizedSource = await tx.task.findMany({
                    where: { boardId: actualSourceBoardId },
                    orderBy: { position: 'asc' },
                    select: { id: true }
                });

                await Promise.all(
                    normalizedSource.map((task, index) =>
                        tx.task.update({
                            where: { id: task.id },
                            data: { position: index }
                        })
                    )
                );
            }
        });

        const updatedTask = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                board: { select: { id: true, name: true } }
            }
        });

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== TASKS ====================
app.get('/api/tasks', async (req, res) => {
    try {
        const { page = 1, limit = 50, projectId, boardId, status, priority, assignedToId } = req.query;
        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100); // Max 100 per page

        const where = {};
        if (projectId) where.projectId = projectId;
        if (boardId) where.boardId = boardId;
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = assignedToId;

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    position: true,
                    dueDate: true,
                    boardId: true,
                    projectId: true,
                    assignedTo: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { position: 'asc' },
                skip,
                take
            }),
            prisma.task.count({ where })
        ]);

        res.json({
            data: tasks,
            pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasks/:id', async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                board: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                attachments: true
            }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { dueDate, ...otherData } = req.body;

        // Handle datetime-local format if provided
        const parseDateTime = (dateStr) => {
            if (!dateStr) return null;
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
            throw new Error(`Invalid date format: ${dateStr}`);
        };

        const data = {
            ...otherData,
            ...(dueDate && { dueDate: parseDateTime(dueDate) })
        };

        const task = await prisma.task.create({
            data,
            include: { assignedTo: { select: { id: true, name: true, avatar: true } }, board: { select: { id: true, name: true } } }
        });
        res.json(task);
    } catch (error) {
        console.error('POST /api/tasks error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/tasks/:id', async (req, res) => {
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body,
            include: { assignedTo: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CHANNELS ====================
app.get('/api/channels', async (req, res) => {
    try {
        const channels = await prisma.channel.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                members: { select: { id: true } }
            }
        });
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/channels/:id', async (req, res) => {
    try {
        const channel = await prisma.channel.findUnique({
            where: { id: req.params.id },
            include: {
                team: true,
                members: { select: { id: true, name: true, avatar: true } },
                messages: { include: { user: true }, orderBy: { createdAt: 'desc' }, take: 50 }
            }
        });
        res.json(channel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== MESSAGES ====================
app.get('/api/messages', async (req, res) => {
    try {
        const { channelId, conversationId, page, limit } = req.query;

        // Build where clause - ensure channels and direct messages never mix
        const where = {};

        if (channelId) {
            // Channel messages: must have channelId, must NOT have conversationId
            where.channelId = channelId;
            where.conversationId = null;
        } else if (conversationId) {
            // Direct messages: must have conversationId, must NOT have channelId
            where.conversationId = conversationId;
            where.channelId = null;
        } else {
            // Default: return all direct messages (conversationId present, channelId absent)
            where.channelId = null;
            where.conversationId = {
                not: null
            };
        }

        // If pagination params provided, return with pagination
        if (page || limit) {
            const pageNum = Math.max(1, parseInt(page) || 1);
            const pageLimit = Math.min(parseInt(limit) || 50, 100);
            const skip = (pageNum - 1) * pageLimit;

            const [messages, total] = await Promise.all([
                prisma.message.findMany({
                    where,
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        createdAt: true,
                        channelId: true,
                        conversationId: true,
                        user: { select: { id: true, name: true, avatar: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: pageLimit
                }),
                prisma.message.count({ where })
            ]);

            return res.json({
                data: messages.reverse(),
                pagination: { page: pageNum, limit: pageLimit, total, pages: Math.ceil(total / pageLimit) }
            });
        }

        // Default: return simple array
        const messages = await prisma.message.findMany({
            where,
            select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                channelId: true,
                conversationId: true,
                user: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { content, type, userId, channelId, conversationId } = req.body;

        // Validate: messages must have either channelId OR conversationId, not both
        if ((channelId && conversationId) || (!channelId && !conversationId)) {
            return res.status(400).json({
                error: 'Message must have either channelId (for channels) or conversationId (for direct messages), but not both'
            });
        }

        const message = await prisma.message.create({
            data: { content, type, userId, channelId, conversationId },
            include: { user: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to see message distribution
app.get('/api/messages/debug/count', async (req, res) => {
    try {
        const channelMessages = await prisma.message.count({
            where: { channelId: { not: null }, conversationId: null }
        });
        const directMessages = await prisma.message.count({
            where: { conversationId: { not: null }, channelId: null }
        });
        const orphaned = await prisma.message.count({
            where: {
                OR: [
                    { channelId: null, conversationId: null },
                    { AND: [{ channelId: { not: null } }, { conversationId: { not: null } }] }
                ]
            }
        });

        res.json({
            channelMessages,
            directMessages,
            orphanedOrInvalid: orphaned
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CALENDAR EVENTS ====================
app.get('/api/calendar-events', async (req, res) => {
    try {
        const events = await prisma.calendarEvent.findMany({
            orderBy: { startTime: 'asc' }
        });
        res.json(events);
    } catch (error) {
        console.error('GET /api/calendar-events error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/calendar-events', async (req, res) => {
    try {
        const { title, description, startTime, endTime, location, attendeeIds } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields: title, startTime, endTime' });
        }

        // Handle datetime-local format from HTML input (e.g., "2026-03-23T14:30")
        // These come without timezone info, so we parse them as-is
        const parseDateTime = (dateStr) => {
            if (!dateStr) return null;
            // If it's already a valid ISO string or parseable date, use it
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
            throw new Error(`Invalid date format: ${dateStr}`);
        };

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description: description || null,
                startTime: parseDateTime(startTime),
                endTime: parseDateTime(endTime),
                location: location || null,
                attendeeIds: attendeeIds && Array.isArray(attendeeIds) ? attendeeIds : []
            }
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('POST /api/calendar-events error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== TIME RECORDS ====================
app.get('/api/time-records', async (req, res) => {
    try {
        const { userId, date } = req.query;
        const where = {};
        if (userId) where.userId = userId;
        if (date) where.date = new Date(date);

        const records = await prisma.timeRecord.findMany({
            where,
            include: { user: { select: { id: true, name: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/time-records', async (req, res) => {
    try {
        const record = await prisma.timeRecord.create({
            data: req.body,
            include: { user: true }
        });
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/time-records/:id', async (req, res) => {
    try {
        const record = await prisma.timeRecord.update({
            where: { id: req.params.id },
            data: req.body,
            include: { user: true }
        });
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CODE DOCUMENTATION ====================
app.get('/api/documentation', async (req, res) => {
    try {
        const summaryOnly = req.query.summary === 'true';

        const docs = await prisma.codeDocumentation.findMany(
            summaryOnly
                ? {
                    where: { isPublished: true },
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        description: true,
                        updatedAt: true,
                        createdBy: { select: { id: true, name: true, avatar: true } }
                    },
                    orderBy: { updatedAt: 'desc' }
                }
                : {
                    where: { isPublished: true },
                    include: { createdBy: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { updatedAt: 'desc' }
                }
        );
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/documentation/:id', async (req, res) => {
    try {
        const doc = await prisma.codeDocumentation.findUnique({
            where: { id: req.params.id },
            include: { createdBy: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/documentation', async (req, res) => {
    try {
        const doc = await prisma.codeDocumentation.create({
            data: req.body,
            include: { createdBy: { select: { id: true, name: true } } }
        });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ACTIVITY LOGS ====================
app.get('/api/activities', async (req, res) => {
    try {
        const { projectId, userId, page = 1, limit = 50 } = req.query;
        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100);

        const where = {};
        if (projectId) where.projectId = projectId;
        if (userId) where.userId = userId;

        const [activities, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                select: {
                    id: true,
                    type: true,
                    description: true,
                    createdAt: true,
                    user: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: activities,
            pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

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