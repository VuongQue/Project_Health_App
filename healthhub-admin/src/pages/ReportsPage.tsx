import { useEffect, useState } from "react";
import { adminReportsApi } from "../api/admin.api";
import type { Report } from "../api/admin.api";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  REVIEWED: "Đang xem",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Bác bỏ",
};

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HATE_SPEECH: "Ngôn từ thù ghét",
  VIOLENCE: "Bạo lực",
  HARASSMENT: "Quấy rối",
  MISINFORMATION: "Thông tin sai lệch",
  NSFW: "Nội dung 18+",
  OTHER: "Khác",
};

export default function ReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [resolveModal, setResolveModal] = useState<Report | null>(null);
  const [action, setAction] = useState<"warn" | "hide" | "dismiss">("dismiss");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminReportsApi.list({
        page: p,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const data = res.data as any;
      setItems(data.items ?? data.reports ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openResolve = (r: Report) => {
    setResolveModal(r);
    setAction("dismiss");
    setAdminNote("");
  };

  const submitResolve = async () => {
    if (!resolveModal) return;
    setSubmitting(true);
    try {
      await adminReportsApi.resolve(resolveModal._id, action, adminNote || undefined);
      setResolveModal(null);
      load(page);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      REVIEWED: "bg-blue-100 text-blue-700",
      RESOLVED: "bg-green-100 text-green-700",
      DISMISSED: "bg-gray-100 text-gray-500",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? "bg-gray-100"}`}>
        {STATUS_LABELS[status] ?? status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Báo cáo vi phạm</h2>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Lọc trạng thái:</span>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="REVIEWED">Đang xem</option>
            <option value="RESOLVED">Đã xử lý</option>
            <option value="DISMISSED">Bác bỏ</option>
          </select>
          <button
            onClick={() => load(1)}
            className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loading && <div className="text-gray-500 mb-2 text-sm">Đang tải...</div>}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b text-left text-sm text-gray-600">
              <th className="p-3">Người báo cáo</th>
              <th className="p-3">Lý do</th>
              <th className="p-3 max-w-xs">Nội dung post</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Ngày</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-3">
                  <div className="font-medium">{r.reporter?.name ?? r.reporterId}</div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">
                    {REASON_LABELS[r.reason] ?? r.reason}
                  </span>
                </td>
                <td className="p-3 max-w-xs">
                  <div className="truncate text-gray-600 max-w-[200px]">
                    {r.post?.content ?? "(không có nội dung)"}
                  </div>
                </td>
                <td className="p-3 text-gray-500 max-w-[160px]">
                  <div className="truncate">{r.description || "—"}</div>
                </td>
                <td className="p-3">{statusBadge(r.status)}</td>
                <td className="p-3 text-gray-400 whitespace-nowrap">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="p-3">
                  {r.status === "PENDING" || r.status === "REVIEWED" ? (
                    <button
                      className="text-blue-600 hover:underline text-sm font-medium"
                      onClick={() => openResolve(r)}
                    >
                      Xử lý
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">{r.adminNote || "—"}</span>
                  )}
                </td>
              </tr>
            ))}

            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Không có báo cáo nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center gap-2">
        <button
          className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => load(page - 1)}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Trang {page} / {totalPages || 1} &nbsp;(Tổng {total} báo cáo)
        </span>
        <button
          className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => load(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[480px] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Xử lý báo cáo</h3>
              <button onClick={() => setResolveModal(null)} className="text-gray-400 hover:text-gray-700">✖</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded text-sm space-y-1">
              <div><span className="text-gray-500">Lý do:</span> <strong>{REASON_LABELS[resolveModal.reason] ?? resolveModal.reason}</strong></div>
              <div><span className="text-gray-500">Mô tả:</span> {resolveModal.description || "—"}</div>
              {resolveModal.post?.content && (
                <div><span className="text-gray-500">Nội dung post:</span> <span className="italic">{resolveModal.post.content.slice(0, 120)}...</span></div>
              )}
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Chọn hành động:</div>
              <div className="space-y-2">
                {[
                  { val: "warn", label: "⚠️ Cảnh cáo người đăng", desc: "Gửi warning tới tác giả bài viết" },
                  { val: "hide", label: "🙈 Ẩn bài viết", desc: "Ẩn post khỏi feed công khai" },
                  { val: "dismiss", label: "✅ Bác bỏ báo cáo", desc: "Báo cáo không có cơ sở" },
                ].map((opt) => (
                  <label key={opt.val} className={`flex items-start gap-3 p-3 border rounded cursor-pointer ${action === opt.val ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                    <input
                      type="radio"
                      name="action"
                      value={opt.val}
                      checked={action === opt.val}
                      onChange={() => setAction(opt.val as any)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-sm font-medium text-gray-700 mb-1">Ghi chú admin (tùy chọn)</div>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Lý do xử lý, ghi chú nội bộ..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded text-sm"
                onClick={() => setResolveModal(null)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                disabled={submitting}
                onClick={submitResolve}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
