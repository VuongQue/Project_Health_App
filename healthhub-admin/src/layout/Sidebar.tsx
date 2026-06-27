import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminReportsApi } from "../api/admin.api";

const links = [
  { to: "/", label: "Dashboard", icon: "🏠", exact: true },
  { to: "/users", label: "Người dùng", icon: "👥" },
  { to: "/workouts", label: "Workouts", icon: "💪" },
  { to: "/posts", label: "Bài đăng", icon: "📝" },
  { to: "/achievements", label: "Achievements", icon: "🏆" },
  { to: "/challenges", label: "Challenges", icon: "🎯" },
  { to: "/events", label: "Sự kiện", icon: "📅" },
  { to: "/reports", label: "Báo cáo vi phạm", icon: "🚨" },
];

export default function Sidebar() {
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await adminReportsApi.list({ page: 1, limit: 1, status: "PENDING" });
        const data = res.data as any;
        setPendingReports(data.total ?? 0);
      } catch {}
    };
    fetchPending();
    const id = setInterval(fetchPending, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="font-bold text-gray-800">HealthHub</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.exact}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-500 text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base">{l.icon}</span>
              {l.label}
            </span>
            {l.to === "/reports" && pendingReports > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {pendingReports > 99 ? "99+" : pendingReports}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs text-gray-400">
        HealthHub Admin v1.0
      </div>
    </aside>
  );
}
