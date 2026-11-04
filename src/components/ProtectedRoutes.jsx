import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoginN } from "./auth/LoginN.jsx";
import Modal from "react-bootstrap/Modal";

export const ProtectedRoutes = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!currentUser) {
    const goHome = () => navigate("/", { replace: true });

    return (
      <Modal
        show
        onHide={goHome}
        centered
        contentClassName="bg-transparent border-0"
      >
        <Modal.Body className="p-0">
          <LoginN onClose={goHome} />
        </Modal.Body>
      </Modal>
    );
  }

  if (userRole === null) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        Loading account...
      </div>
    );
  }

  const isAllowed =
    !allowedRoles ||
    allowedRoles.includes(userRole) ||
    (userRole === "host" && allowedRoles.includes("customer")) ||
    userRole === "admin";

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};