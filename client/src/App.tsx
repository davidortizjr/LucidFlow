import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ElectronTitleBar from './components/Layout/ElectronTitleBar.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ProtectedRoute } from './contexts/ProtectedRoute.tsx';

const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const BoardsPage = lazy(() => import('./pages/BoardsPage.tsx'));
const TeamPage = lazy(() => import('./pages/TeamPage.tsx'));
const MessagesPage = lazy(() => import('./pages/MessagesPage.tsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.tsx'));
const TimeInOutPage = lazy(() => import('./pages/TimeInOutPage.tsx'));
const CodeDocumentationPage = lazy(() => import('./pages/CodeDocumentationPage.tsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx'));
const HelpPage = lazy(() => import('./pages/HelpPage.tsx'));

function PageFallback() {
  return (
    <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
      <div className="px-6 pb-12 pt-16">
        <div className="h-8 w-56 bg-surface-container-lowest rounded-lg animate-pulse mb-6" />
        <div className="h-64 bg-surface-container-lowest rounded-2xl animate-pulse" />
      </div>
    </main>
  );
}

function App() {
  return (
    <>
      <ElectronTitleBar />
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="/boards" element={<BoardsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/time-tracking" element={<TimeInOutPage />} />
              <Route path="/code-docs" element={<CodeDocumentationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </>
  );
}

export default App;
