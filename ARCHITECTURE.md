# LucidFlow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ├── Components (UI, Layout, Dashboard)                     │
│  ├── Pages (Router-based screens)                           │
│  ├── Hooks (API calls, state management)                    │
│  └── Types (TypeScript definitions)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  ├── Routes (API endpoints)                                 │
│  ├── Controllers (Business logic)                           │
│  ├── Middleware (Auth, CORS, etc)                           │
│  ├── Validators (Input validation)                          │
│  └── Utils (Helper functions)                               │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL/Prisma
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL/Neon)                      │
│  ├── Users & Teams                                          │
│  ├── Projects & Tasks (Kanban)                              │
│  ├── Channels & Messages                                    │
│  ├── Calendar Events                                        │
│  └── Activity Logs                                          │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Core Models
- **User** - Team members with roles and statuses
- **Team** - Groups of users collaborating on projects
- **Project** - Container for boards and tasks
- **Board** - Kanban board columns (Todo, In Progress, Done)
- **Task** - Individual work items with assignments and deadlines

### Communication Models
- **Channel** - Team-wide chat channels
- **Conversation** - Direct messaging between users
- **Message** - Individual messages with file support

### Tracking Models
- **CalendarEvent** - Scheduled events and deadlines
- **TimeRecord** - Time tracking entries
- **ActivityLog** - User action history

### Documentation
- **CodeDocumentation** - Shared technical documentation

## API Design

### REST Endpoints Pattern
```
GET    /api/resource              - List all
GET    /api/resource/:id          - Get one
POST   /api/resource              - Create
PUT    /api/resource/:id          - Update
DELETE /api/resource/:id          - Delete
```

### Response Format
```json
{
  "data": {...},
  "error": null,
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

## Frontend Architecture

### Component Hierarchy
```
App
├── Layout (Header, Sidebar, Navbar)
└── Pages
    ├── DashboardPage
    │   ├── StatsPanel
    │   ├── CalendarPanel
    │   └── ActivityPanel
    ├── BoardsPage (Kanban)
    ├── MessagesPage (Chat)
    ├── CalendarPage
    ├── TeamPage
    ├── TimeInOutPage
    ├── SettingsPage
    ├── CodeDocumentationPage
    └── ...
```

### State Management
- React Hooks for local state
- Custom `/hooks/useApi.ts` for API calls with caching
- Query string for pagination

## Backend Architecture

### Route Organization
```
/api
├── /users
├── /teams
├── /projects
├── /boards
├── /tasks
├── /channels
├── /messages
├── /calendar-events
├── /time-records
├── /activities
├── /documentation
└── /settings
```

### Middleware Stack
1. CORS handling
2. JSON parsing
3. Error handling
4. Request logging (future)

### Database Access Pattern
- Prisma Client for all database operations
- Adapter pattern for database drivers
- Connection pooling for performance

## Performance Considerations

### Frontend
- Code splitting via Vite
- Component lazy loading
- API response caching
- Optimistic updates

### Backend
- Database indexes on frequently queried fields
- Connection pooling
- Efficient Prisma queries with `select`
- Pagination for large datasets

## Security

### Implementation
- CORS configured for specific origin
- Input validation on all endpoints
- SQL injection prevention via Prisma
- Prepared statements (Prisma ORM)

### Future Enhancements
- JWT authentication
- Rate limiting
- HTTPS enforcement
- API key management

## Deployment

### Frontend (Static)
- Build: `pnpm build`
- Output: `./dist` folder
- Host on: Vercel, Netlify, AWS S3

### Backend (Node.js)
- Deploy: Docker/Container
- Runtime: Node.js 18+
- Environment: Docker, Railway, Heroku, AWS

### Database
- PostgreSQL hosted on Neon
- Automatic backups
- SSL connection required
