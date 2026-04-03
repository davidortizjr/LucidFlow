import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
                <div className="px-6 pb-12 pt-16">
                    <div className="h-8 w-56 bg-surface-container-lowest rounded-lg animate-pulse mb-6" />
                    <div className="h-64 bg-surface-container-lowest rounded-2xl animate-pulse" />
                </div>
            </main>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
