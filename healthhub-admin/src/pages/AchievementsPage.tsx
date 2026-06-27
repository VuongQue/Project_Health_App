import { useEffect, useState } from "react";
import { adminAchievementsApi } from "../api/admin.api";
import type { Achievement } from "../api/admin.api";

const emptyForm: Partial<Achievement> = { code: "", name: "", points: 0 };

export default function AchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState<Partial<Achievement>>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAchievementsApi.list();
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const startEdit = (a: Achievement) => {
    setEditing(a);
    setForm({ code: a.code, name: a.name, points: a.points });
    setOpenForm(true);
  };

  const submit = async () => {
    if (!form.code || !form.name) {
      alert("Vui lòng điền mã và tên thành tích");
      return;
    }
    if (editing) {
      await adminAchievementsApi.update(editing.id, form);
    } else {
      await adminAchievementsApi.create(form);
    }
    setOpenForm(false);
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Xoá thành tích này?")) return;
    await adminAchievementsApi.remove(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Thành tích</h2>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          + Thêm mới
        </button>
      </div>

      {loading && <div className="text-gray-500 mb-2">Đang tải...</div>}

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Mã</th>
            <th className="p-2">Tên</th>
            <th className="p-2">Điểm</th>
            <th className="p-2">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {items.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="p-2">{a.code}</td>
              <td className="p-2">{a.name}</td>
              <td className="p-2">{a.points}</td>
              <td className="p-2 space-x-3">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => startEdit(a)}
                >
                  Sửa
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => onDelete(a.id)}
                >
                  Xoá
                </button>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-400">
                Chưa có thành tích nào
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[520px] rounded-xl p-5 shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editing ? "Chỉnh sửa thành tích" : "Tạo thành tích mới"}
              </h3>
              <button onClick={() => setOpenForm(false)}>✖</button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Mã thành tích</div>
                <input
                  className="border rounded w-full px-3 py-2"
                  value={form.code || ""}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Tên</div>
                <input
                  className="border rounded w-full px-3 py-2"
                  value={form.name || ""}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Điểm thưởng</div>
                <input
                  type="number"
                  className="border rounded w-full px-3 py-2"
                  value={Number(form.points ?? 0)}
                  onChange={(e) => setForm((p) => ({ ...p, points: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setOpenForm(false)}>
                Huỷ
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={submit}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
