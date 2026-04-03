# LucidFlow Backend API Documentation

## ✅ Server Status
- **Status**: Running on `http://localhost:3000`
- **Database**: PostgreSQL on Neon
- **Connection**: Using PrismaPg adapter for ES module support

## 📋 API Endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID with teams and tasks
- **POST** `/api/users` - Create new user
  - Body: `{ email, name, password, role?, avatar?, status? }`

### Teams
- **GET** `/api/teams` - Get all teams with members and projects
- **GET** `/api/teams/:id` - Get specific team with full details
- **POST** `/api/teams` - Create new team
  - Body: `{ name, description?, avatar?, members?: { connect: [...] } }`

### Projects
- **GET** `/api/projects` - Get all projects with team and tasks
- **GET** `/api/projects/:id/boards` - Get boards for a project
- **POST** `/api/projects` - Create new project
  - Body: `{ name, description?, teamId, status?, startDate?, endDate? }`

### Boards
- **GET** `/api/boards/:id` - Get board with tasks
- **PATCH** `/api/boards/:id` - Update board

### Tasks
- **GET** `/api/tasks` - Get all tasks with relations
- **GET** `/api/tasks/:id` - Get task with board, project, creator, assignee
- **POST** `/api/tasks` - Create new task
  - Body: `{ title, description?, status?, priority?, boardId, projectId, createdById, assignedToId?, dueDate? }`
- **PATCH** `/api/tasks/:id` - Update task
  - Body: Partial task update

### Channels
- **GET** `/api/channels` - Get all channels
- **GET** `/api/channels/:id` - Get channel with team and last 50 messages
- **POST** `/api/channels` - Create new channel
  - Body: `{ name, description?, teamId, isPrivate? }`

### Messages
- **GET** `/api/messages/:channelId` - Get messages from channel
- **POST** `/api/messages` - Create new message
  - Body: `{ content, type?, userId, channelId?, conversationId? }`

### Calendar Events
- **GET** `/api/calendar-events` - Get all calendar events
- **POST** `/api/calendar-events` - Create new event
  - Body: `{ title, description?, startTime, endTime, location?, attendeeIds? }`

### Time Records
- **GET** `/api/time-records` - Get all time records (filterable by userId, date)
- **GET** `/api/time-records/:id` - Get specific time record with user
- **POST** `/api/time-records` - Create time record (clock in)
  - Body: `{ userId, clockInTime }`
- **PATCH** `/api/time-records/:id` - Update time record (clock out)
  - Body: `{ clockOutTime, duration?, notes? }`

### Code Documentation
- **GET** `/api/documentation` - Get all documentation
- **POST** `/api/documentation` - Create documentation
  - Body: `{ title, description?, category, content, createdById, version?, isPublished?, tags? }`

### Activity Logs
- **GET** `/api/activities` - Get all activity logs
- **GET** `/api/activities/:id` - Get specific activity
- **POST** `/api/activities` - Create activity log (typically auto-created)

## 📊 Sample Data

The database has been pre-seeded with:
- **5 Users**: Elena (ADMIN), Marcus (MANAGER), Sarah, David, Amina (MEMBERS)
- **1 Team**: LucidFlow Core with all users
- **3 Projects**: LucidFlow Dashboard, Mobile App, API Integration
- **4 Boards**: Backlog, In Progress, In Review, Done
- **5 Tasks**: Various statuses and assignments
- **4 Channels**: general, development, random, announcements
- **6 Messages**: Sample messages in different channels
- **4 Calendar Events**: Sprint Planning, Daily Standup, Code Review, Project Deadline
- **5 Time Records**: Clock in/out data for users
- **5 Documentation Entries**: API, Frontend, Database, Setup, Testing guides
- **5 Activity Logs**: Task creation, updates, messaging activities
- **5 User Settings**: Preferences for all users

## 🔐 Authentication

Currently using placeholder passwords for demonstration:
- All users have passwords: `hashed_password_1` through `hashed_password_5`
- **TODO**: Implement proper JWT authentication

## 🚀 Testing the API

### Using curl:
```bash
# Get all users
curl http://localhost:3000/api/users

# Get specific project with boards
curl http://localhost:3000/api/projects

# Create a new task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "boardId": "board-1",
    "projectId": "proj-1",
    "createdById": "user-1"
  }'
```

### Using PowerShell:
```powershell
# Get all users
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Get

# Create new task
$body = @{
    title = "New Task"
    boardId = "board-1"
    projectId = "proj-1"
    createdById = "user-1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" -Method Post -Body $body -ContentType "application/json"
```

## 🔧 Environment Setup

Required environment variables in `server/.env`:
```
DATABASE_URL="postgresql://neondb_owner:npg_uF1YeL2qSmgE@ep-holy-lab-a7x5twhh-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=3000
```

## ⚠️ Important Notes

1. **Prisma 7.5.0**: Requires `@prisma/adapter-pg` for PostgreSQL connections
2. **ES Modules**: Project uses `"type": "module"` in package.json
3. **SSL Connection**: Database requires `sslmode=require` for Neon connection pool
4. **Graceful Shutdown**: Server properly closes database connections on exit

## 🔄 Recent Changes

- ✅ Updated `index.js` to use PrismaPg adapter
- ✅ Added graceful shutdown handlers (SIGTERM, SIGINT)
- ✅ Installed `@prisma/adapter-pg` (v7.5.0)
- ✅ Fixed Prisma Client initialization for ES modules
- ✅ Tested all API endpoints - verified data retrieval

## 📝 Next Steps for Frontend Integration

1. Create React hooks for data fetching:
   - `useUsers()` - Fetch all users
   - `useProjects()` - Fetch projects with boards
   - `useTasks()` - Fetch tasks by board
   - `useMessages()` - Fetch messages by channel
   - `useTimeRecords()` - Fetch time records

2. Update components to use API data instead of mock data:
   - Dashboard: Use data from `/api/activities` and `/api/time-records`
   - TeamPage: Use data from `/api/teams/:id`
   - BoardsPage: Use data from `/api/projects/:id/boards`
   - MessagesPage: Use data from `/api/channels` and `/api/messages`
   - CalendarPage: Use data from `/api/calendar-events`
   - TimeInOutPage: Use data from `/api/time-records`

3. Implement proper error handling and loading states

4. Add authentication/authorization (JWT tokens)
