import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAllowedRole = user.systemRole?.some(role => allowedRoles.includes(role));
  
  if (!hasAllowedRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}