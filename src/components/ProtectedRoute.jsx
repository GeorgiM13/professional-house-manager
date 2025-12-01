import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ProtectedRoute = ({ requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (error || !data) {
        console.error("Грешка при проверка на правата:", error);
        setLoading(false);
        return;
      }

      setUserRole(data.role);
      
      if (!requiredRole || data.role === requiredRole) {
        setIsAllowed(true);
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [requiredRole]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        Зареждане...
      </div>
    );
  }
  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAllowed) {
    if (userRole === 'user') {
        return <Navigate to="/client/userevents" replace />;
    }
    if (userRole === 'admin') {
        return <Navigate to="/admin/adminevents" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;