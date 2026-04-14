import 'dotenv/config.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';

async function seed() {
    const saltRounds = 10;
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // Clear existing data in correct order (respecting foreign keys)
        console.log('Clearing existing data...');
        try {
            await prisma.notification.deleteMany({});
            await prisma.userSettings.deleteMany({});
            await prisma.activityLog.deleteMany({});
            await prisma.codeDocumentation.deleteMany({});
            await prisma.timeRecord.deleteMany({});
            await prisma.calendarEvent.deleteMany({});
            await prisma.attachment.deleteMany({});
            await prisma.comment.deleteMany({});
            await prisma.message.deleteMany({});
            await prisma.conversation.deleteMany({});
            await prisma.$executeRawUnsafe('DELETE FROM "_ChannelToUser"');
            await prisma.channel.deleteMany({});
            await prisma.task.deleteMany({});
            await prisma.board.deleteMany({});
            await prisma.project.deleteMany({});
            await prisma.$executeRawUnsafe('DELETE FROM "_TeamToUser"');
            await prisma.team.deleteMany({});
            await prisma.user.deleteMany({});
        } catch (e) {
            console.log('Some tables might be empty, continuing...');
        }

        // Seed users
        console.log('Seeding users...');

        // Hash passwords for each user
        const hashedPasswords = await Promise.all([
            bcryptjs.hash('Elena2024@', saltRounds),      // elena@lucidflow.com
            bcryptjs.hash('Marcus2024@', saltRounds),     // marcus@lucidflow.com
            bcryptjs.hash('Sarah2024@', saltRounds),      // sarah@lucidflow.com
            bcryptjs.hash('David2024@', saltRounds),      // david@lucidflow.com
            bcryptjs.hash('Amina2024@', saltRounds),      // amina@lucidflow.com
        ]);

        const users = await Promise.all([
            prisma.user.create({
                data: {
                    id: 'user-1',
                    email: 'elena@lucidflow.com',
                    name: 'Elena Rodriguez',
                    password: hashedPasswords[0],
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
                    role: 'ADMIN',
                    status: 'online',
                    isActive: true,
                },
            }),
            prisma.user.create({
                data: {
                    id: 'user-2',
                    email: 'marcus@lucidflow.com',
                    name: 'Marcus Chen',
                    password: hashedPasswords[1],
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
                    role: 'MANAGER',
                    status: 'online',
                    isActive: true,
                },
            }),
            prisma.user.create({
                data: {
                    id: 'user-3',
                    email: 'sarah@lucidflow.com',
                    name: 'Sarah Williams',
                    password: hashedPasswords[2],
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                    role: 'MEMBER',
                    status: 'online',
                    isActive: true,
                },
            }),
            prisma.user.create({
                data: {
                    id: 'user-4',
                    email: 'david@lucidflow.com',
                    name: 'David Wilson',
                    password: hashedPasswords[3],
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
                    role: 'MEMBER',
                    status: 'away',
                    isActive: true,
                },
            }),
            prisma.user.create({
                data: {
                    id: 'user-5',
                    email: 'amina@lucidflow.com',
                    name: 'Amina Okafor',
                    password: hashedPasswords[4],
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina',
                    role: 'MEMBER',
                    status: 'online',
                    isActive: true,
                },
            }),
        ]);
        console.log(' Created 5 users');

        // Seed team
        console.log('Seeding team...');
        const team = await prisma.team.create({
            data: {
                id: 'team-1',
                name: 'LucidFlow Core',
                description: 'Main development team for LucidFlow dashboard',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team',
                members: {
                    connect: users.map(u => ({ id: u.id })),
                },
            },
        });
        console.log(' Created 1 team with all users');

        // Seed projects
        console.log('Seeding projects...');
        const projects = await Promise.all([
            prisma.project.create({
                data: {
                    id: 'proj-1',
                    name: 'LucidFlow Dashboard',
                    description: 'Main dashboard application',
                    teamId: team.id,
                    status: 'active',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-06-30'),
                },
            }),
            prisma.project.create({
                data: {
                    id: 'proj-2',
                    name: 'Mobile App',
                    description: 'Mobile version of LucidFlow',
                    teamId: team.id,
                    status: 'active',
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-07-31'),
                },
            }),
            prisma.project.create({
                data: {
                    id: 'proj-3',
                    name: 'API Integration',
                    description: 'Third-party API integrations',
                    teamId: team.id,
                    status: 'active',
                    startDate: new Date('2025-01-15'),
                    endDate: new Date('2025-05-15'),
                },
            }),
        ]);
        console.log(' Created 3 projects');

        // Seed boards
        console.log('Seeding boards...');
        const boards = await Promise.all([
            prisma.board.create({
                data: {
                    id: 'board-1',
                    name: 'Backlog',
                    projectId: projects[0].id,
                    position: 0,
                },
            }),
            prisma.board.create({
                data: {
                    id: 'board-2',
                    name: 'In Progress',
                    projectId: projects[0].id,
                    position: 1,
                },
            }),
            prisma.board.create({
                data: {
                    id: 'board-3',
                    name: 'In Review',
                    projectId: projects[0].id,
                    position: 2,
                },
            }),
            prisma.board.create({
                data: {
                    id: 'board-4',
                    name: 'Done',
                    projectId: projects[0].id,
                    position: 3,
                },
            }),
        ]);
        console.log(' Created 4 boards');

        // Seed tasks
        console.log('Seeding tasks...');
        const now = new Date();
        await Promise.all([
            prisma.task.create({
                data: {
                    id: 'task-1',
                    title: 'Setup authentication system',
                    description: 'Implement JWT authentication',
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    boardId: boards[1].id,
                    projectId: projects[0].id,
                    createdById: users[0].id,
                    assignedToId: users[1].id,
                    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                    position: 0,
                },
            }),
            prisma.task.create({
                data: {
                    id: 'task-2',
                    title: 'Create user dashboard',
                    description: 'Design and implement user dashboard',
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    boardId: boards[1].id,
                    projectId: projects[0].id,
                    createdById: users[0].id,
                    assignedToId: users[2].id,
                    dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
                    position: 1,
                },
            }),
            prisma.task.create({
                data: {
                    id: 'task-3',
                    title: 'Database optimization',
                    description: 'Optimize database queries and indexes',
                    status: 'TODO',
                    priority: 'MEDIUM',
                    boardId: boards[0].id,
                    projectId: projects[0].id,
                    createdById: users[0].id,
                    assignedToId: users[1].id,
                    dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                    position: 0,
                },
            }),
            prisma.task.create({
                data: {
                    id: 'task-4',
                    title: 'API endpoint testing',
                    description: 'Write comprehensive API tests',
                    status: 'IN_REVIEW',
                    priority: 'HIGH',
                    boardId: boards[2].id,
                    projectId: projects[0].id,
                    createdById: users[0].id,
                    assignedToId: users[3].id,
                    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
                    position: 0,
                },
            }),
            prisma.task.create({
                data: {
                    id: 'task-5',
                    title: 'UI/UX improvements',
                    description: 'Refine user interface and experience',
                    status: 'DONE',
                    priority: 'MEDIUM',
                    boardId: boards[3].id,
                    projectId: projects[0].id,
                    createdById: users[0].id,
                    assignedToId: users[4].id,
                    dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                    position: 0,
                },
            }),
        ]);
        console.log(' Created 5 tasks');

        // Seed channels
        console.log('Seeding channels...');
        const channels = await Promise.all([
            prisma.channel.create({
                data: {
                    id: 'channel-1',
                    name: 'general',
                    description: 'General discussion',
                    teamId: team.id,
                    isPrivate: false,
                    members: {
                        connect: users.map(u => ({ id: u.id })),
                    },
                },
            }),
            prisma.channel.create({
                data: {
                    id: 'channel-2',
                    name: 'development',
                    description: 'Development discussion',
                    teamId: team.id,
                    isPrivate: false,
                    members: {
                        connect: users.slice(0, 3).map(u => ({ id: u.id })),
                    },
                },
            }),
            prisma.channel.create({
                data: {
                    id: 'channel-3',
                    name: 'random',
                    description: 'Random thoughts and off-topic',
                    teamId: team.id,
                    isPrivate: false,
                    members: {
                        connect: users.map(u => ({ id: u.id })),
                    },
                },
            }),
            prisma.channel.create({
                data: {
                    id: 'channel-4',
                    name: 'announcements',
                    description: 'Important announcements',
                    teamId: team.id,
                    isPrivate: false,
                    members: {
                        connect: users.map(u => ({ id: u.id })),
                    },
                },
            }),
        ]);
        console.log(' Created 4 channels');

        // Seed conversations for direct messages
        console.log('Seeding conversations...');
        const conversations = await Promise.all([
            prisma.conversation.create({
                data: {
                    id: 'conv-1',
                    participantIds: [users[1].id, users[2].id],
                },
            }),
            prisma.conversation.create({
                data: {
                    id: 'conv-2',
                    participantIds: [users[3].id, users[4].id],
                },
            }),
        ]);
        console.log(' Created 2 conversations');

        // Seed messages
        console.log('Seeding messages...');
        await Promise.all([
            prisma.message.create({
                data: {
                    id: 'msg-1',
                    content: 'Welcome to LucidFlow! This is our main discussion channel.',
                    type: 'TEXT',
                    userId: users[0].id,
                    channelId: channels[0].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'msg-2',
                    content: 'Great project setup! Looking forward to working on this.',
                    type: 'TEXT',
                    userId: users[1].id,
                    channelId: channels[0].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'msg-3',
                    content: 'Let\'s discuss the authentication system approach',
                    type: 'TEXT',
                    userId: users[0].id,
                    channelId: channels[1].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'msg-4',
                    content: 'I think JWT would be the best approach',
                    type: 'TEXT',
                    userId: users[1].id,
                    channelId: channels[1].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'msg-5',
                    content: 'Check out this meme I found 😂',
                    type: 'TEXT',
                    userId: users[2].id,
                    channelId: channels[2].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'msg-6',
                    content: 'Important: Team meeting tomorrow at 2 PM',
                    type: 'TEXT',
                    userId: users[0].id,
                    channelId: channels[3].id,
                },
            }),
            // Direct messages (conversationId-based)
            prisma.message.create({
                data: {
                    id: 'direct-msg-1',
                    content: 'Hey, how is the authentication setup going?',
                    type: 'TEXT',
                    userId: users[1].id,
                    conversationId: conversations[0].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'direct-msg-2',
                    content: 'Going well! I\'ll have it ready by tomorrow.',
                    type: 'TEXT',
                    userId: users[2].id,
                    conversationId: conversations[0].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'direct-msg-3',
                    content: 'Perfect! Let me know if you need any help.',
                    type: 'TEXT',
                    userId: users[1].id,
                    conversationId: conversations[0].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'direct-msg-4',
                    content: 'Did you see the new design mockups?',
                    type: 'TEXT',
                    userId: users[3].id,
                    conversationId: conversations[1].id,
                },
            }),
            prisma.message.create({
                data: {
                    id: 'direct-msg-5',
                    content: 'Not yet, I\'ll check them out this afternoon',
                    type: 'TEXT',
                    userId: users[4].id,
                    conversationId: conversations[1].id,
                },
            }),
        ]);
        console.log(' Created 11 messages (6 channel messages + 5 direct messages)');

        // Seed calendar events
        console.log('Seeding calendar events...');
        await Promise.all([
            prisma.calendarEvent.create({
                data: {
                    id: 'event-1',
                    title: 'Sprint Planning',
                    description: 'Plan tasks for the upcoming sprint',
                    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
                    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
                    location: 'Conference Room A',
                    attendeeIds: [users[0].id, users[1].id, users[2].id],
                },
            }),
            prisma.calendarEvent.create({
                data: {
                    id: 'event-2',
                    title: 'Daily Standup',
                    description: 'Daily team standup meeting',
                    startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                    endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
                    location: 'Zoom',
                    attendeeIds: users.map(u => u.id),
                },
            }),
            prisma.calendarEvent.create({
                data: {
                    id: 'event-3',
                    title: 'Code Review Session',
                    description: 'Review recent pull requests',
                    startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                    endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
                    location: 'Conference Room B',
                    attendeeIds: [users[1].id, users[2].id, users[3].id],
                },
            }),
            prisma.calendarEvent.create({
                data: {
                    id: 'event-4',
                    title: 'Project Deadline',
                    description: 'Phase 1 delivery deadline',
                    startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    endTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
                    location: 'N/A',
                    attendeeIds: users.map(u => u.id),
                },
            }),
        ]);
        console.log(' Created 4 calendar events');

        // Seed time records
        console.log('Seeding time records...');
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        await Promise.all([
            prisma.timeRecord.create({
                data: {
                    id: 'time-1',
                    userId: users[0].id,
                    clockInTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
                    clockOutTime: new Date(now.getTime() - 60 * 60 * 1000),
                    duration: 420,
                    date: now,
                    notes: 'Productive day',
                },
            }),
            prisma.timeRecord.create({
                data: {
                    id: 'time-2',
                    userId: users[1].id,
                    clockInTime: new Date(now.getTime() - 8.5 * 60 * 60 * 1000),
                    clockOutTime: new Date(now.getTime() - 30 * 60 * 1000),
                    duration: 450,
                    date: now,
                    notes: 'Working on auth system',
                },
            }),
            prisma.timeRecord.create({
                data: {
                    id: 'time-3',
                    userId: users[2].id,
                    clockInTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
                    clockOutTime: new Date(now.getTime() - 45 * 60 * 1000),
                    duration: 435,
                    date: now,
                    notes: 'UI improvements',
                },
            }),
            prisma.timeRecord.create({
                data: {
                    id: 'time-4',
                    userId: users[3].id,
                    clockInTime: new Date(now.getTime() - 7.5 * 60 * 60 * 1000),
                    clockOutTime: new Date(now.getTime() - 15 * 60 * 1000),
                    duration: 405,
                    date: now,
                    notes: 'Testing APIs',
                },
            }),
            prisma.timeRecord.create({
                data: {
                    id: 'time-5',
                    userId: users[4].id,
                    clockInTime: new Date(now.getTime() - 32 * 60 * 60 * 1000),
                    clockOutTime: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
                    duration: 450,
                    date: yesterday,
                    notes: 'Yesterday\'s work',
                },
            }),
        ]);
        console.log(' Created 5 time records');

        // Seed code documentation
        console.log('Seeding code documentation...');
        await Promise.all([
            prisma.codeDocumentation.create({
                data: {
                    id: 'doc-1',
                    title: 'API Authentication',
                    description: 'How to authenticate API requests',
                    category: 'Backend',
                    content: 'Authentication is handled using JWT tokens. Include the token in the Authorization header: Authorization: Bearer <token>',
                    createdById: users[1].id,
                    version: 1,
                    isPublished: true,
                    tags: ['api', 'auth', 'jwt'],
                },
            }),
            prisma.codeDocumentation.create({
                data: {
                    id: 'doc-2',
                    title: 'Component Structure',
                    description: 'Frontend component best practices',
                    category: 'Frontend',
                    content: 'All components are located in src/components. Use TypeScript for type safety. Follow the naming convention: PascalCase for component files.',
                    createdById: users[2].id,
                    version: 1,
                    isPublished: true,
                    tags: ['react', 'components', 'typescript'],
                },
            }),
            prisma.codeDocumentation.create({
                data: {
                    id: 'doc-3',
                    title: 'Database Schema',
                    description: 'Database structure and relationships',
                    category: 'Database',
                    content: "The database uses PostgreSQL with Prisma ORM. Models are defined in prisma/schema.prisma. Run 'pnpm exec prisma migrate dev' to apply migrations.",
                    createdById: users[1].id,
                    version: 1,
                    isPublished: true,
                    tags: ['database', 'prisma', 'postgresql'],
                },
            }),
            prisma.codeDocumentation.create({
                data: {
                    id: 'doc-4',
                    title: 'Development Setup',
                    description: 'Getting started with the project',
                    category: 'General',
                    content: "Clone the repository, run 'pnpm install' in both client and server directories, then 'pnpm dev' in each to start the development servers.",
                    createdById: users[0].id,
                    version: 1,
                    isPublished: true,
                    tags: ['setup', 'development', 'getting-started'],
                },
            }),
            prisma.codeDocumentation.create({
                data: {
                    id: 'doc-5',
                    title: 'Testing Guidelines',
                    description: 'How to write and run tests',
                    category: 'Testing',
                    content: 'Use Jest for unit tests and Cypress for e2e tests. Place test files next to the source files with .test.ts extension.',
                    createdById: users[3].id,
                    version: 1,
                    isPublished: true,
                    tags: ['testing', 'jest', 'cypress'],
                },
            }),
        ]);
        console.log(' Created 5 code documentation entries');

        // Seed activity logs
        console.log('Seeding activity logs...');
        await Promise.all([
            prisma.activityLog.create({
                data: {
                    id: 'activity-1',
                    type: 'TASK_CREATED',
                    userId: users[0].id,
                    projectId: projects[0].id,
                    description: 'Elena created task: Setup authentication system',
                    metadata: JSON.stringify({ taskId: 'task-1' }),
                },
            }),
            prisma.activityLog.create({
                data: {
                    id: 'activity-2',
                    type: 'TASK_UPDATED',
                    userId: users[1].id,
                    projectId: projects[0].id,
                    description: 'Marcus updated task status to IN_PROGRESS',
                    metadata: JSON.stringify({ taskId: 'task-1', status: 'IN_PROGRESS' }),
                },
            }),
            prisma.activityLog.create({
                data: {
                    id: 'activity-3',
                    type: 'MESSAGE_SENT',
                    userId: users[0].id,
                    projectId: projects[0].id,
                    description: 'Elena sent message in general channel',
                    metadata: JSON.stringify({ channelId: 'channel-1' }),
                },
            }),
            prisma.activityLog.create({
                data: {
                    id: 'activity-4',
                    type: 'USER_JOINED',
                    userId: users[3].id,
                    projectId: projects[0].id,
                    description: 'David joined the project',
                    metadata: JSON.stringify({ projectId: 'proj-1' }),
                },
            }),
            prisma.activityLog.create({
                data: {
                    id: 'activity-5',
                    type: 'PROJECT_CREATED',
                    userId: users[0].id,
                    projectId: projects[0].id,
                    description: 'Elena created project: LucidFlow Dashboard',
                    metadata: JSON.stringify({ projectId: 'proj-1' }),
                },
            }),
        ]);
        console.log(' Created 5 activity logs');

        // Seed user settings
        console.log('Seeding user settings...');
        await Promise.all([
            prisma.userSettings.create({
                data: {
                    id: 'settings-1',
                    userId: users[0].id,
                    theme: 'light',
                    language: 'en',
                    notifications: true,
                    emailDigest: true,
                    timezone: 'EST',
                },
            }),
            prisma.userSettings.create({
                data: {
                    id: 'settings-2',
                    userId: users[1].id,
                    theme: 'dark',
                    language: 'en',
                    notifications: true,
                    emailDigest: true,
                    timezone: 'PST',
                },
            }),
            prisma.userSettings.create({
                data: {
                    id: 'settings-3',
                    userId: users[2].id,
                    theme: 'light',
                    language: 'en',
                    notifications: true,
                    emailDigest: false,
                    timezone: 'CST',
                },
            }),
            prisma.userSettings.create({
                data: {
                    id: 'settings-4',
                    userId: users[3].id,
                    theme: 'dark',
                    language: 'en',
                    notifications: false,
                    emailDigest: false,
                    timezone: 'EST',
                },
            }),
            prisma.userSettings.create({
                data: {
                    id: 'settings-5',
                    userId: users[4].id,
                    theme: 'light',
                    language: 'en',
                    notifications: true,
                    emailDigest: true,
                    timezone: 'GMT',
                },
            }),
        ]);
        console.log(' Created 5 user settings');

        console.log('\n Database seeding completed successfully!\n');
        console.log('Summary:');
        console.log('- 5 Users created');
        console.log('- 1 Team created with all users as members');
        console.log('- 3 Projects created');
        console.log('- 4 Boards created');
        console.log('- 5 Tasks created');
        console.log('- 4 Channels created');
        console.log('- 6 Messages created');
        console.log('- 4 Calendar events created');
        console.log('- 5 Time records created');
        console.log('- 5 Code documentation entries created');
        console.log('- 5 Activity logs created');
        console.log('- 5 User settings configured');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

seed();
