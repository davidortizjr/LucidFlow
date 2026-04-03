# 🚀 LucidFlow - Quick Start

Get LucidFlow up and running in 5 minutes!

## Prerequisites
- Node.js 18+
- PostgreSQL (or [Neon](https://neon.tech) for cloud DB)

## Quick Start

### 1. Install Dependencies
```bash
cd server && pnpm install && cd ..
cd client && pnpm install && cd ..
```

### 2. Setup Environment
```bash
# Server
cd server
cp .env.example .env
# Edit .env with your DATABASE_URL

# Initialize database
pnpm db:push
pnpm seed
cd ..

# Client  
cd client
cp .env.example .env
cd ..
```

### 3. Run Locally

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
```
✅ Server on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd client
pnpm dev
```
✅ App on `http://localhost:5173`

## 📚 Learn More

- [Development Setup Guide](SETUP.md) - Detailed installation
- [Architecture Overview](ARCHITECTURE.md) - System design
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [API Documentation](server/API_DOCUMENTATION.md) - API reference

## 🎯 First Steps

1. **Explore Dashboard** - See sample data
2. **Create a Task** - Test Kanban board
3. **Send a Message** - Test chat feature
4. **Check Code** - Review component structure

## ❓ Troubleshooting

**Server fails:** Clear cache and reinstall
```bash
cd server && rm -rf node_modules pnpm-lock.yaml && pnpm install
```

**Database error:** Verify `DATABASE_URL` in `.env`

**API not connecting:** Check `VITE_API_BASE_URL` in client `.env`

## 💡 Tech Stack

Frontend: React 19, TypeScript, Vite, Tailwind
Backend: Express, Prisma, PostgreSQL

### Option 3: Browser
Simply visit: http://localhost:3000/api/users

---

## Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server status check |
| `/api/users` | GET | All users |
| `/api/projects` | GET | All projects with tasks |
| `/api/teams/:id` | GET | Team with members |
| `/api/channels` | GET | All channels |
| `/api/messages/:channelId` | GET | Messages in channel |
| `/api/tasks` | GET | All tasks |
| `/api/calendar-events` | GET | Calendar events |
| `/api/time-records` | GET | Time records |
| `/api/documentation` | GET | Code docs |
| `/api/activities` | GET | Activity logs |

See [server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md) for full details.

---

## Test User Credentials

```
Email: elena@lucidflow.com (Admin)
Email: marcus@lucidflow.com (Manager)
Email: sarah@lucidflow.com (Member)
Email: david@lucidflow.com (Member)
Email: amina@lucidflow.com (Member)

Password: (placeholder - implement JWT authentication)
```

---

## Database Contents Summary

| Type | Count | Status |
|------|-------|--------|
| Users | 5 | ✅ Ready |
| Projects | 3 | ✅ Ready |
| Teams | 1 | ✅ Ready |
| Boards | 4 | ✅ Ready |
| Tasks | 5 | ✅ Ready |
| Channels | 4 | ✅ Ready |
| Messages | 6 | ✅ Ready |
| Calendar Events | 4 | ✅ Ready |
| Time Records | 5 | ✅ Ready |
| Documentation | 5 | ✅ Ready |
| Activity Logs | 5 | ✅ Ready |
| User Settings | 5 | ✅ Ready |

---

## Common Issues & Solutions

### Issue: "Cannot GET /api/users"
**Solution**: Make sure server is running with `pnpm start`

### Issue: "ECONNREFUSED 127.0.0.1:3000"
**Solution**: Start the server in another terminal first

### Issue: "Database connection error"
**Solution**: Check `.env` file has DATABASE_URL set

### Issue: "Port 3000 already in use"
**Solution**: Change PORT in .env or kill process on port 3000

---

## Next Steps: Frontend Integration

To connect your React components to the backend:

1. **Create a hook** (`useApi.ts`):
```typescript
export function useProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch('http://localhost:3000/api/projects')
            .then(r => r.json())
            .then(setProjects)
            .finally(() => setLoading(false));
    }, []);
    return { projects, loading };
}
```

2. **Use in components**:
```typescript
export function BoardsPage() {
    const { projects, loading } = useProjects();
    if (loading) return <Loading />;
    return <ProjectList projects={projects} />;
}
```

3. **Update these components**:
   - Dashboard → Use `/api/activities` + `/api/time-records`
   - TeamPage → Use `/api/teams`
   - BoardsPage → Use `/api/projects` → `/api/boards`
   - MessagesPage → Use `/api/channels` → `/api/messages`
   - CalendarPage → Use `/api/calendar-events`
   - TimeInOutPage → Use `/api/time-records`

---

## 📖 Documentation Files

- **API Reference**: [server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md)
- **Full Setup Guide**: [BACKEND_SETUP_COMPLETE.md](./BACKEND_SETUP_COMPLETE.md)
- **Database Schema**: [server/prisma/schema.prisma](./server/prisma/schema.prisma)

---

## 🔧 Troubleshooting

Need help? Check these files:
- `server/.env` - Database connection string
- `server/index.js` - API endpoints
- `server/seed.js` - Data structure
- `server/prisma/schema.prisma` - Database models

---

**You're all set! 🎉**
The backend is ready. Next step is connecting your React frontend to these API endpoints.
