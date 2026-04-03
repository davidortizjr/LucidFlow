# Frontend Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── StatsPanel.tsx
│   │   │   ├── CalendarPanel.tsx
│   │   │   └── ActivityPanel.tsx
│   │   ├── Layout/
│   │   │   ├── SideNavBar.tsx
│   │   │   ├── TopNavBar.tsx
│   │   │   └── MobileNavBar.tsx
│   │   └── [Other components]
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── BoardsPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── TeamPage.tsx
│   │   ├── TimeInOutPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── CodeDocumentationPage.tsx
│   │
│   ├── hooks/
│   │   ├── useApi.ts           # API calls with caching
│   │   └── useTimeTracker.ts   # Time tracking logic
│   │
│   ├── layout/
│   │   └── AppLayout.tsx       # Main layout wrapper
│   │
│   ├── types/
│   │   └── [Type definitions]
│   │
│   ├── assets/
│   │   └── [Logos, images]
│   │
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css              # Global styles
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.js
└── package.json
```

## Component Guidelines

### Page Components
- Located in `/pages` directory
- Handle routing and page-level logic
- Connect to API via hooks

### Layout Components
- Located in `/components/Layout`
- Reusable structural components
- MobileNavBar, TopNavBar, SideNavBar

### Feature Components
- Located in `/components/[Feature]`
- Self-contained feature modules
- Dashboard, Project Panels, etc

### Hooks
- Custom data fetching in `useApi.ts`
- Includes caching mechanism
- Request deduplication

## Styling
- Tailwind CSS for all components
- Utility-first approach
- No inline styles
