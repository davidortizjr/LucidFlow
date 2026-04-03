# Development Setup Guide

## Prerequisites

Ensure you have installed:
- **Node.js** v18+ (Download from https://nodejs.org)
- **PostgreSQL** v14+ (or use [Neon](https://neon.tech) for serverless Postgres)
- **Git** (for version control)

Verify installations:
```bash
node --version   # Should be v18+
npm --version    # Or use pnpm
```

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd LucidFlow
```

### 2. Install Dependencies
```bash
# If using npm
npm install

# If using pnpm (recommended)
pnpm install

# Install backend dependencies
cd server && pnpm install && cd ..

# Install frontend dependencies  
cd client && pnpm install && cd ..
```

### 3. Setup Database

#### Option A: Neon (Cloud - Recommended)
1. Create account at https://neon.tech
2. Create new project
3. Copy connection string

#### Option B: Local PostgreSQL
```bash
# Create database
createdb lucidflow_db

# Connection string format
postgresql://username:password@localhost:5432/lucidflow_db
```

### 4. Configure Environment Variables

**Server (.env):**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
DATABASE_URL=your_database_url_here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Client (.env):**
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENV=development
```

### 5. Initialize Database

```bash
cd server

# Generate Prisma Client
pnpm prisma:generate

# Push schema to database
pnpm db:push

# Seed with sample data
pnpm seed
```

## Running Development Server

### Start Backend (Terminal 1)
```bash
cd server
pnpm dev
```

Server runs on `http://localhost:3000`

API docs: `http://localhost:3000/api/projects` (test endpoint)

### Start Frontend (Terminal 2)
```bash
cd client  
pnpm dev
```

Frontend runs on `http://localhost:5173`

## Common Commands

### Backend
```bash
pnpm start              # Production mode
pnpm dev                # Development with hot reload
pnpm seed               # Seed database
pnpm db:push            # Sync schema changes
pnpm db:migrate         # Run existing migrations
pnpm db:studio          # Open Prisma Studio GUI
pnpm prisma:generate    # Regenerate Prisma Client
```

### Frontend
```bash
pnpm dev                # Dev server with hot reload
pnpm build              # Production build
pnpm preview            # Preview production build
pnpm lint               # Check for linting errors
pnpm type-check         # TypeScript type checking
pnpm format             # Format code
```

## Troubleshooting

### Server won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | grep :3000  # Windows
```

### Database connection fails
```bash
# Verify DATABASE_URL is correct
# Test connection
psql your_database_url

# Or use Prisma to test
pnpm prisma db execute --stdin < /dev/null
```

### Frontend won't connect to API
- Check `VITE_API_BASE_URL` in `.env`
- Ensure backend is running on port 3000
- Check browser DevTools Network tab for errors
- CORS errors? Verify `CORS_ORIGIN` in server `.env`

### Type errors in frontend
```bash
cd client
pnpm type-check

# If issues persist, regenerate types
rm -rf node_modules/.vite
pnpm dev
```

## Code Style

### TypeScript
- Use `interface` for object shapes
- Avoid `any` type
- Use strict mode

### React Components
- Use functional components with hooks
- Use PascalCase for component names
- Place styles in component using className

### CSS
- Use Tailwind CSS classes
- Avoid inline styles
- Organize with utility classes

## Testing

Currently no automated tests. Manual testing:
1. Create sample data through API
2. Test CRUD operations
3. Test filtering and pagination
4. Test UI interactions

## Next Steps

After setup:
1. Explore the codebase structure in [ARCHITECTURE.md](../ARCHITECTURE.md)
2. Review API documentation in [API_DOCUMENTATION.md](../server/API_DOCUMENTATION.md)
3. Start with a small feature to get familiar with the flow
4. Check [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines

## Getting Help

- Check [ARCHITECTURE.md](../ARCHITECTURE.md) for system overview
- Review existing components for patterns
- Check error messages carefully
- Search GitHub issues for similar problems
