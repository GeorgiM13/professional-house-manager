import { Navigate } from "react-router-dom";

function PrivateRoute({ children, userRole, allowedRoles }) {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" />;
  }
  return children;
}


export default PrivateRoute;
