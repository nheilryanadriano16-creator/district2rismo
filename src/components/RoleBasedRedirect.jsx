import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RoleBasedRedirect({ children }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (location.state?.allowHomePage) {
    return children;
  }

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>;
  }

  if (currentUser) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (userRole === 'host') {
      return <Navigate to="/host" replace />;
    }
  }

  return children;
}