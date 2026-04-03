# Backend Project Structure

```
server/
├── src/
│   ├── server.js              # Main entry point
│   │
│   ├── routes/                # API route definitions
│   │   ├── users.js
│   │   ├── teams.js
│   │   ├── projects.js
│   │   ├── boards.js
│   │   ├── tasks.js
│   │   ├── messages.js
│   │   ├── channels.js
│   │   ├── events.js
│   │   └── ...
│   │
│   ├── controllers/           # Business logic handlers
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   └── ...
│   │
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── auth.js (future)
│   │
│   ├── validators/            # Input validation
│   │   ├── userValidator.js
│   │   ├── projectValidator.js
│   │   └── ...
│   │
│   └── utils/                 # Helper functions
│       ├── database.js
│       ├── response.js
│       └── ...
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── models/                # Domain models
│   │   ├── user.prisma
│   │   ├── project.prisma
│   │   ├── task.prisma
│   │   ├── messaging.prisma
│   │   ├── calendar.prisma
│   │   └── ...
│   └── migrations/            # Database migrations
│
├── seed.js                     # Database seeding script
├── package.json
├── .env                        # Environment variables
├── .env.example               # Example env template
└── API_DOCUMENTATION.md       # API reference
```

## File Organization Best Practices

### Routes
- One route file per resource (users.js, projects.js)
- Use RESTful conventions
- Minimal logic - delegate to controllers

### Controllers
- Contains business logic
- Handles data transformation
- Calls Prisma for database operations

### Middleware
- Reusable request/response handlers
- Error handling centralized
- Logging and validation

### Validators
- Input validation logic
- Request payload verification
- Error message formatting

### Utils
- Helper functions
- Database utilities
- Response formatting

## API Endpoint Patterns

```
GET    /api/resource              # List all
GET    /api/resource/:id          # Get single
POST   /api/resource              # Create
PUT    /api/resource/:id          # Update (full)
PATCH  /api/resource/:id          # Update (partial)
DELETE /api/resource/:id          # Delete
```

## Database Design

Models in `prisma/models/`:
- `user.prisma` - User accounts and authentication
- `team-project.prisma` - Teams, projects, boards, tasks
- `messaging.prisma` - Channels, conversations, messages
- `calendar.prisma` - Events and scheduling
- `time-tracking.prisma` - Time records
- `documentation.prisma` - Code documentation
- `activity.prisma` - Activity logs
- `settings.prisma` - User settings
- `enums.prisma` - Shared enumerations

## Performance Optimization

- Database indexes on frequently queried fields
- Connection pooling via Prisma
- Efficient queries with `select` to minimize data transfer
- Caching responses at API level (future)
