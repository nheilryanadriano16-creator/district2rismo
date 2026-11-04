import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/roles";

export const ProtectedRoutes = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const role = normalizeRole(userRole);

  if (loading) return null; 

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

 
  const isAllowed =
    !allowedRoles ||
    allowedRoles.includes(role) ||
    (role === "host" && allowedRoles.includes("customer")) ||
    role === "admin"; 

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};