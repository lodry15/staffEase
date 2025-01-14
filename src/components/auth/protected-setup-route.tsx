import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface ProtectedSetupRouteProps {
  children: React.ReactNode;
}

export function ProtectedSetupRoute({ children }: ProtectedSetupRouteProps) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to admin dashboard if user doesn't need setup
  if (!user.needsInitialSetup) {
    return <Navigate to="/admin" replace />;
  }

  // Only allow admin users
  if (!user.systemRole.includes('admin')) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}