import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || !user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
