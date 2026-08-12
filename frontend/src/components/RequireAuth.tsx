import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, isAuthenticated } from '../lib/api';

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const location = useLocation();
  const user = getStoredUser();

  if (!isAuthenticated() || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default RequireAuth;
