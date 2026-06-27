import { useEffect, useState } from "react";
import { adminWorkoutsApi } from "../api/admin.api";
import type { Workout } from "../api/admin.api";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Nâng cao",
};
const CATEGORIES = ["CARDIO", "STRENGTH", "FLEXIBILITY", "YOGA", "HIIT", "OTHER"];
const CATEGORY_LABELS: Record<string, string> = {
  CARDIO: "Cardio",
  STRENGTH: "Sức mạnh",
  FLEXIBILITY: "Linh hoạt",
  YOGA: "Yoga",
  HIIT: "HIIT",
  OTHER: "Khác",
};

const emptyForm: Partial<Workout> = {
  title: "",
  level: "BEGINNER",
  category: "OTHER",
  kcalPerMin: 5,
};

export default function WorkoutsPage() {
  const [items, setItems] = useState<Workout[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [form, setForm] = useState<Partial<Workout>>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminWorkoutsApi.list(keyword ? { keyword } : undefined);
      setItems(Array.isArray(res.data) ? res.data : (res.data as any).items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const startEdit = (w: Workout) => {
    setEditing(w);
    setForm({ title: w.title, level: w.level, category: w.category, kcalPerMin: w.kcalPerMin });
    setOpenForm(true);
  };

  const submit = async () => {
    if (!form.title?.trim()) {
      alert("Vui lòng nhập tên workout");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await adminWorkoutsApi.update(editing.id, form);
      } else {
        await adminWorkoutsApi.create(form);
      }
      setOpenForm(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Xoá workout này?")) return;
    await adminWorkoutsApi.remove(id);
    load();
  };

  const levelBadge = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: "bg-green-100 text-green-700",
      INTERMEDIATE: "bg-yellow-100 text-yellow-700",
      ADVANCED: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[level] ?? "bg-gray-100 text-gray-600"}`}>
        {LEVEL_LABELS[level] ?? level}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Bài tập</h2>
        <button onClick={startCreate} className="px-4 py-2 bg-blue-500 text-white rounded">
          + Thêm workout
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Tìm kiếm workout..."
          className="border px-3 py-2 rounded w-64"
        />
        <button onClick={load} className="px-4 py-2 bg-blue-500 text-white rounded">
          Tìm
        </button>
      </div>

      {loading && <div className="text-gray-500 mb-2 text-sm">Đang tải...</div>}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b text-left text-sm text-gray-600">
              <th className="p-3">Tên bài tập</th>
              <th className="p-3">Cấp độ</th>
              <th className="p-3">Danh mục</th>
              <th className="p-3">Kcal/min</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-3 font-medium">{w.title}</td>
                <td className="p-3">{levelBadge(w.level)}</td>
                <td className="p-3 text-gray-600">{CATEGORY_LABELS[w.category] ?? w.category}</td>
                <td className="p-3 text-gray-600">{w.kcalPerMin}</td>
                <td className="p-3 space-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => startEdit(w)}>
                    Sửa
                  </button>
                  <button className="text-red-500 hover:underline" onClick={() => onDelete(w.id)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  Chưa có bài tập nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[520px] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editing ? "Sửa workout" : "Thêm workout mới"}</h3>
              <button onClick={() => setOpenForm(false)} className="text-gray-400 hover:text-gray-700">✖</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Tên workout *</label>
                <input
                  className="border rounded w-full px-3 py-2"
                  value={form.title || ""}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="VD: Full Body HIIT 30 phút"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Cấp độ</label>
                  <select
                    className="border rounded w-full px-3 py-2"
                    value={form.level || "BEGINNER"}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Danh mục</label>
                  <select
                    className="border rounded w-full px-3 py-2"
                    value={form.category || "OTHER"}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Calories đốt (kcal/phút)</label>
                <input
                  type="number"
                  min={0}
                  className="border rounded w-full px-3 py-2"
                  value={Number(form.kcalPerMin ?? 5)}
                  onChange={(e) => setForm((p) => ({ ...p, kcalPerMin: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded text-sm" onClick={() => setOpenForm(false)}>
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                disabled={submitting}
                onClick={submit}
              >
                {submitting ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
