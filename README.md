# LucidFlow - Team Collaboration Platform

A modern, full-stack team collaboration and project management platform built with React, Express, Prisma, and PostgreSQL.

## 🎯 Features

- **Project Management** - Create, organize, and track projects with Kanban boards
- **Team Collaboration** - Real-time messaging and direct conversations
- **Task Tracking** - Assign tasks, set priorities, and track progress
- **Calendar Integration** - Schedule events and track deadlines
- **Time Tracking** - Log work hours and track productivity
- **Code Documentation** - Organize and share technical documentation
- **Activity Feed** - Real-time activity logs for team awareness

## 🏗️ Project Structure

```
LucidFlow/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layout/        # Layout components
│   │   ├── types/         # TypeScript type definitions
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── server.js      # Main server entry point
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── controllers/   # Business logic controllers
│   │   ├── validators/    # Input validation
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema
│   │   ├── schema.prisma
│   │   └── models/        # Domain models
│   ├── seed.js            # Database seeding
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

1. **Clone and Setup**
```bash
cd LucidFlow
pnpm install
```

2. **Configure Environment**

Server setup:
```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
pnpm prisma db push
pnpm seed
```

Client setup:
```bash
cd client
cp .env.example .env
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
```
Server runs on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd client
pnpm dev
```
Frontend runs on http://localhost:5173

## 📚 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Framer Motion** - Animations
- **GSAP** - Advanced animations
- **Hello Pangea Drag & Drop** - Kanban functionality

### Backend
- **Express 5** - Web framework
- **Prisma 7** - ORM
- **PostgreSQL** - Database
- **Neon** - Serverless Postgres
- **Node.js** - Runtime

## 📖 API Documentation

See [server/API_DOCUMENTATION.md](server/API_DOCUMENTATION.md) for detailed API endpoints.

### Main Endpoints
- `GET /api/users` - List all users
- `GET /api/projects` - List projects
- `GET /api/projects/:id/boards` - Get project boards
- `GET /api/messages` - Get messages
- `GET /api/channels` - List channels
- `GET /api/tasks` - List tasks
- `GET /api/calendar-events` - List events

## 🛠️ Development

### Database

Push schema changes:
```bash
cd server
pnpm db:push
```

Run migrations:
```bash
pnpm db:migrate
```

Open Prisma Studio:
```bash
pnpm db:studio
```

### Code Quality

Frontend linting:
```bash
cd client
pnpm lint
pnpm type-check
```

## 📦 Building

Build for production:

**Frontend:**
```bash
cd client
pnpm build
```

**Backend:** (No build needed, uses ES modules directly)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - See LICENSE for details

## 📧 Support

For issues and questions, visit the project repository or contact the team.
