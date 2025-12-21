import { useEffect, useState } from "react";
import { getWorkouts, deleteWorkout } from "../api/admin.api";

export default function WorkoutsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");

  const load = async () => {
    const res = await getWorkouts(
      keyword ? { keyword } : undefined
    );
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: number) => {
    if (!confirm("Delete this workout?")) return;
    await deleteWorkout(id);
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Workouts</h2>

      {/* SEARCH */}
      <div className="mb-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search workout..."
          className="border px-3 py-2 rounded w-64"
        />
        <button
          onClick={load}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Search
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Level</th>
            <th className="p-2">Category</th>
            <th className="p-2">Calories</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((w) => (
            <tr key={w.id} className="border-b">
              <td className="p-2 font-medium">{w.title}</td>
              <td className="p-2">{w.level}</td>
              <td className="p-2">{w.category}</td>
              <td className="p-2">{w.kcalPerMin} kcal/min</td>
              <td className="p-2">
                <button
                  onClick={() => onDelete(w.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-400">
                No workouts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
