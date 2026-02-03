/**
 * AuthLayout Template
 * Centered layout for login/register pages
 *
 * SOLID-S: Layout only, no auth logic
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { PageSpinner, AnimatedOutlet } from '@/components/atoms';

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PageSpinner />
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <img src="/logo.png" alt="Casha" className="h-8 w-8" />
          <span className="text-xl font-bold text-text-primary">Casha</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <AnimatedOutlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-sm text-text-muted">
        <p>&copy; {new Date().getFullYear()} Casha. Track smarter, spend better.</p>
      </footer>
    </div>
  );
}
