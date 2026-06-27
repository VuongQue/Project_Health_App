import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminStatsApi, adminReportsApi } from "../api/admin.api";

type StatItem = {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
  route?: string;
  badge?: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingReports, setPendingReports] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          adminStatsApi.get(),
          adminReportsApi.list({ page: 1, limit: 1, status: "PENDING" }),
        ]);
        setStats(statsRes.data);
        const rData = reportsRes.data as any;
        setPendingReports(rData.total ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Đang tải...</div>;
  if (!stats) return <div className="p-4 text-red-500">Không thể tải dữ liệu</div>;

  const statItems: StatItem[] = [
    {
      label: "Người dùng",
      value: stats.totalUsers,
      icon: "👥",
      color: "text-blue-700",
      bg: "bg-blue-50",
      route: "/users",
    },
    {
      label: "Bài tập",
      value: stats.totalWorkouts,
      icon: "💪",
      color: "text-green-700",
      bg: "bg-green-50",
      route: "/workouts",
    },
    {
      label: "Bài đăng",
      value: stats.totalPosts,
      icon: "📝",
      color: "text-purple-700",
      bg: "bg-purple-50",
      route: "/posts",
    },
    {
      label: "Báo cáo chờ xử lý",
      value: pendingReports,
      icon: "🚨",
      color: "text-red-700",
      bg: "bg-red-50",
      route: "/reports",
      badge: pendingReports,
    },
    {
      label: "Achievements đạt được",
      value: stats.totalUserAchievements,
      icon: "🏆",
      color: "text-yellow-700",
      bg: "bg-yellow-50",
      route: "/achievements",
    },
    {
      label: "Thử thách tham gia",
      value: stats.totalUserChallenges,
      icon: "🎯",
      color: "text-orange-700",
      bg: "bg-orange-50",
      route: "/challenges",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống HealthHub</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.route && navigate(item.route)}
            className={`relative text-left p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${item.bg}`}
          >
            {item.badge != null && item.badge > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            <div className="text-3xl mb-3">{item.icon}</div>
            <div className={`text-3xl font-bold ${item.color}`}>{item.value.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-700 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: "👤", label: "Thêm người dùng", route: "/users" },
            { icon: "💪", label: "Thêm workout", route: "/workouts" },
            { icon: "🏆", label: "Thêm achievement", route: "/achievements" },
            { icon: "🎯", label: "Thêm challenge", route: "/challenges" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.route)}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition"
            >
              <span className="text-2xl">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending reports banner */}
      {pendingReports > 0 && (
        <div
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-red-100 transition"
          onClick={() => navigate("/reports")}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-semibold text-red-700">Có {pendingReports} báo cáo vi phạm chờ xử lý</div>
              <div className="text-sm text-red-500">Nhấn để xem và xử lý ngay</div>
            </div>
          </div>
          <span className="text-red-500 text-lg">→</span>
        </div>
      )}
    </div>
  );
}
