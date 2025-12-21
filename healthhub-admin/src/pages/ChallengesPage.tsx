import { useEffect, useState } from "react";
import { getChallenges } from "../api/admin.api";

export default function ChallengesPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getChallenges().then((res) => setItems(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Challenges</h2>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Target</th>
            <th className="p-2">Active</th>
          </tr>
        </thead>

        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.type}</td>
              <td className="p-2">{c.targetCount}</td>
              <td className="p-2">
                {c.isActive ? "✅" : "❌"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
