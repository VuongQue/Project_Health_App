import { useEffect, useState } from "react";
import { adminChallengesApi } from "../api/admin.api";
import type { Challenge } from "../api/admin.api";

const emptyForm: Partial<Challenge> = {
  name: "",
  type: "",
  targetCount: 1,
  isActive: true,
};

export default function ChallengesPage() {
  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [form, setForm] = useState<Partial<Challenge>>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminChallengesApi.list();
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

  const startEdit = (c: Challenge) => {
    setEditing(c);
    setForm({
      name: c.name,
      type: c.type,
      targetCount: c.targetCount,
      isActive: c.isActive,
    });
    setOpenForm(true);
  };

  const submit = async () => {
    if (!form.name || !form.type) {
      alert("Vui lòng điền tên và loại thử thách");
      return;
    }
    if (editing) {
      await adminChallengesApi.update(editing.id, form);
    } else {
      await adminChallengesApi.create(form);
    }
    setOpenForm(false);
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Xoá thử thách này?")) return;
    await adminChallengesApi.remove(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Thử thách</h2>
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
            <th className="p-2">Tên</th>
            <th className="p-2">Loại</th>
            <th className="p-2">Mục tiêu</th>
            <th className="p-2">Kích hoạt</th>
            <th className="p-2">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.type}</td>
              <td className="p-2">{c.targetCount}</td>
              <td className="p-2">{c.isActive ? "✅" : "❌"}</td>
              <td className="p-2 space-x-3">
                <button className="text-blue-600 hover:underline" onClick={() => startEdit(c)}>
                  Sửa
                </button>
                <button className="text-red-500 hover:underline" onClick={() => onDelete(c.id)}>
                  Xoá
                </button>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-400">
                Chưa có thử thách nào
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
                {editing ? "Chỉnh sửa thử thách" : "Tạo thử thách mới"}
              </h3>
              <button onClick={() => setOpenForm(false)}>✖</button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tên thử thách</div>
                <input
                  className="border rounded w-full px-3 py-2"
                  value={form.name || ""}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Loại</div>
                <input
                  className="border rounded w-full px-3 py-2"
                  value={form.type || ""}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Số lượng mục tiêu</div>
                <input
                  type="number"
                  className="border rounded w-full px-3 py-2"
                  value={Number(form.targetCount ?? 1)}
                  onChange={(e) => setForm((p) => ({ ...p, targetCount: Number(e.target.value) }))}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                Kích hoạt
              </label>
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
