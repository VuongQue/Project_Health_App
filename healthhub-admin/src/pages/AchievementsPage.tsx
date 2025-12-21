import { useEffect, useState } from "react";
import { getAchievements } from "../api/admin.api";

export default function AchievementsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getAchievements().then((res) => setItems(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Achievements</h2>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Code</th>
            <th className="p-2">Name</th>
            <th className="p-2">Points</th>
          </tr>
        </thead>

        <tbody>
          {items.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="p-2">{a.code}</td>
              <td className="p-2">{a.name}</td>
              <td className="p-2">{a.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
