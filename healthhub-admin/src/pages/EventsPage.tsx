import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminEventsApi, type AdminEvent } from "../api/admin.api";

const EMPTY: Partial<AdminEvent> = {
  title: "", description: "", type: "online", link: "",
  scope: "PUBLIC", startTime: "", endTime: "", maxParticipants: undefined,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusBadge(event: AdminEvent) {
  const now = Date.now();
  const start = new Date(event.startTime).getTime();
  const end   = new Date(event.endTime).getTime();
  if (now < start)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Sắp diễn ra</span>;
  if (now >= start && now <= end)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Đang diễn ra</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Đã kết thúc</span>;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<AdminEvent>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try { const res = await adminEventsApi.list(); setItems(Array.isArray(res.data) ? res.data : []); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setError("");
    if (!form.title?.trim() || !form.startTime || !form.endTime) {
      setError("Vui lòng điền tên, thời gian bắt đầu và kết thúc"); return;
    }
    setSaving(true);
    try {
      await adminEventsApi.create({
        ...form,
        scope: "PUBLIC",
        startTime: new Date(form.startTime!).toISOString(),
        endTime:   new Date(form.endTime!).toISOString(),
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      });
      setForm(EMPTY); setShowForm(false); load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Không thể tạo sự kiện");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xoá sự kiện này?")) return;
    setDeleting(id);
    try { await adminEventsApi.delete(id); load(); }
    catch (e: any) { alert(e?.response?.data?.message ?? "Xoá thất bại"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý sự kiện</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tạo và quản lý sự kiện công khai cho toàn bộ người dùng</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Tạo sự kiện
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Tạo sự kiện mới</h2>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setError(""); }}
              className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tên sự kiện *</label>
              <input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="VD: Tuần lễ sức khoẻ tháng 7" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                rows={2} placeholder="Mô tả ngắn về sự kiện..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hình thức</label>
              <select value={form.type ?? "online"} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Số lượng tối đa</label>
              <input type="number" value={form.maxParticipants ?? ""} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Không giới hạn" min={1} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Điều kiện xác nhận tiến độ</label>
              <select value={form.conditionType ?? "MANUAL"} onChange={(e) => setForm({ ...form, conditionType: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="MANUAL">✋ Check-in tay</option>
                <option value="WORKOUT">🏋️ Hoàn thành buổi tập</option>
                <option value="STEPS">👟 Đạt số bước chân</option>
                <option value="WATER">💧 Uống đủ nước</option>
                <option value="MEDIA">🎬 Nộp video/ảnh minh chứng</option>
              </select>
            </div>

            {form.conditionType && form.conditionType !== "MANUAL" && form.conditionType !== "MEDIA" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Ngưỡng cần đạt mỗi ngày {form.conditionType === "WORKOUT" ? "(buổi)" : form.conditionType === "STEPS" ? "(bước)" : "(ml)"}
                </label>
                <input type="number" value={form.conditionValue ?? ""} onChange={(e) => setForm({ ...form, conditionValue: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder={form.conditionType === "WORKOUT" ? "VD: 1" : form.conditionType === "STEPS" ? "VD: 8000" : "VD: 2000"} min={1} />
              </div>
            )}

            {form.type === "online" && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Link tham gia</label>
                <input value={form.link ?? ""} onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="https://meet.google.com/..." />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Thời gian bắt đầu *</label>
              <input type="datetime-local" value={form.startTime ?? ""} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Thời gian kết thúc *</label>
              <input type="datetime-local" value={form.endTime ?? ""} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <div className="flex gap-3 justify-end mt-4">
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setError(""); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Huỷ</button>
            <button onClick={handleCreate} disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Đang lưu..." : "Tạo sự kiện"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tổng sự kiện", value: items.length, color: "text-blue-600" },
          { label: "Đang diễn ra", value: items.filter(e => Date.now() >= new Date(e.startTime).getTime() && Date.now() <= new Date(e.endTime).getTime()).length, color: "text-green-600" },
          { label: "Sắp diễn ra",  value: items.filter(e => new Date(e.startTime).getTime() > Date.now()).length, color: "text-yellow-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <span className="text-3xl">📅</span>
            <span className="text-sm">Chưa có sự kiện nào</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sự kiện</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hình thức</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thời gian</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Giới hạn</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 max-w-xs truncate">{event.title}</div>
                    {event.description && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{event.description}</div>
                    )}
                    {event.createdBy && (
                      <div className="text-xs text-gray-400 mt-0.5">bởi {event.createdBy.fullName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {event.type === "online" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Online</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Offline</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    <div>{formatDate(event.startTime)}</div>
                    <div className="text-gray-400">→ {formatDate(event.endTime)}</div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(event)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {event.maxParticipants ? `${event.maxParticipants} người` : "Không giới hạn"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {event.conditionType === "MEDIA" && (
                      <button
                        onClick={() => navigate(`/events/${event.id}/submissions`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3 transition-colors"
                      >
                        📋 Duyệt minh chứng
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      {deleting === event.id ? "Đang xoá..." : "Xoá"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
