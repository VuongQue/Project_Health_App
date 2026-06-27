import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }: any) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== "ADMIN") {
    return <div className="p-10 text-red-500">
      Bạn không có quyền Admin
    </div>;
  }

  return children;
}
