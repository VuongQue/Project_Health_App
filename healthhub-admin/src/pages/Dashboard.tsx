import { useEffect, useState } from "react";
import { getStats } from "../api/admin.api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getStats().then((res) => setStats(res.data));
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard title="Users" value={stats.totalUsers} />
      <StatCard title="Workouts" value={stats.totalWorkouts} />
      <StatCard title="Posts" value={stats.totalPosts} />
      <StatCard title="Achievements" value={stats.totalUserAchievements} />
      <StatCard title="Challenges" value={stats.totalUserChallenges} />
    </div>
  );
}
