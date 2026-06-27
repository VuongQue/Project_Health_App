import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminEventsApi } from "../api/admin.api";
import type { AdminSubmission, SubmissionStatus } from "../api/admin.api";

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending:   "⏳ Chờ duyệt",
  approved:  "✅ Đã duyệt",
  warned:    "⚠️ Nhắc nhở",
  fraud:     "🚫 Gian lận",
  appealing: "📨 Đang khiếu nại",
  restored:  "🔄 Đã phục hồi",
};

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-green-100 text-green-800",
  warned:    "bg-orange-100 text-orange-800",
  fraud:     "bg-red-100 text-red-800",
  appealing: "bg-purple-100 text-purple-800",
  restored:  "bg-blue-100 text-blue-800",
};

const FILTER_TABS: { label: string; value: SubmissionStatus | "" }[] = [
  { label: "Tất cả", value: "" },
  { label: "⏳ Chờ duyệt", value: "pending" },
  { label: "📨 Khiếu nại", value: "appealing" },
  { label: "✅ Đã duyệt", value: "approved" },
  { label: "⚠️ Nhắc nhở", value: "warned" },
  { label: "🚫 Gian lận", value: "fraud" },
];

export default function EventSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = Number(id);

  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminSubmission | null>(null);
  const [reason, setReason] = useState("");
  const [appealNote, setAppealNote] = useState("");
  const [modal, setModal] = useState<"warn" | "fraud" | "resolve" | "detail" | null>(null);
  const [resolveDecision, setResolveDecision] = useState<"restore" | "keep_ban">("restore");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminEventsApi.getSubmissions(eventId, filterStatus || undefined);
      setSubmissions(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openModal = (sub: AdminSubmission, type: typeof modal) => {
    setSelected(sub);
    setReason("");
    setAppealNote("");
    setModal(type);
  };

  const handleApprove = async (sub: AdminSubmission) => {
    if (!confirm(`Duyệt minh chứng ngày ${sub.checkInDate} của ${sub.user.fullName}?`)) return;
    await adminEventsApi.approveSubmission(sub.id);
    load();
  };

  const handleWarn = async () => {
    if (!selected || !reason.trim()) return;
    await adminEventsApi.warnSubmission(selected.id, reason.trim());
    setModal(null);
    load();
  };

  const handleFraud = async () => {
    if (!selected || !reason.trim()) return;
    await adminEventsApi.fraudSubmission(selected.id, reason.trim());
    setModal(null);
    load();
  };

  const handleResolveAppeal = async () => {
    if (!selected) return;
    await adminEventsApi.resolveAppeal(selected.id, resolveDecision, appealNote.trim() || undefined);
    setModal(null);
    load();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 text-sm">← Quay lại</button>
        <h1 className="text-2xl font-bold">Duyệt minh chứng — Event #{eventId}</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              filterStatus === tab.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Không có submission nào</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Người dùng</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Ngày</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Loại</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Ghi chú</th>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {sub.user.avatarUrl
                        ? <img src={sub.user.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{sub.user.fullName?.[0]}</div>
                      }
                      <div>
                        <div className="font-medium">{sub.user.fullName}</div>
                        <div className="text-xs text-gray-400">{sub.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{sub.checkInDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      sub.mediaType === "video" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {sub.mediaType === "video" ? "🎬 Video" : "🖼️ Ảnh"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[sub.status]}`}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{sub.userNote || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Xem media */}
                      <button
                        onClick={() => openModal(sub, "detail")}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-medium"
                      >
                        👁️ Xem
                      </button>

                      {/* Pending: approve / warn / fraud */}
                      {sub.status === "pending" && (
                        <>
                          <button onClick={() => handleApprove(sub)} className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium">✅ Duyệt</button>
                          <button onClick={() => openModal(sub, "warn")} className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium">⚠️ Nhắc nhở</button>
                          <button onClick={() => openModal(sub, "fraud")} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium">🚫 Gian lận</button>
                        </>
                      )}

                      {/* Appealing: resolve appeal */}
                      {sub.status === "appealing" && (
                        <button onClick={() => openModal(sub, "resolve")} className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded font-medium">⚖️ Xét khiếu nại</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Xem media ── */}
      {modal === "detail" && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Minh chứng — {selected.user.fullName} ({selected.checkInDate})</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Media */}
              <div className="bg-gray-50 rounded-xl overflow-hidden border">
                {selected.mediaType === "video"
                  ? <video src={selected.mediaUrl} controls className="w-full max-h-[360px] object-contain" />
                  : <img src={selected.mediaUrl} alt="submission" className="w-full max-h-[360px] object-contain" />
                }
              </div>

              {selected.userNote && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Ghi chú của user:</div>
                  <div className="bg-blue-50 text-blue-800 rounded-lg p-3 text-sm">{selected.userNote}</div>
                </div>
              )}

              {selected.adminReason && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Lý do từ chối trước đó:</div>
                  <div className="bg-red-50 text-red-800 rounded-lg p-3 text-sm">{selected.adminReason}</div>
                </div>
              )}

              {selected.status === "appealing" && selected.appealNote && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Giải thích khiếu nại:</div>
                  <div className="bg-purple-50 text-purple-800 rounded-lg p-3 text-sm">{selected.appealNote}</div>
                  {selected.appealMediaUrl && (
                    <div className="mt-2 bg-gray-50 rounded-xl border overflow-hidden">
                      <div className="text-xs font-semibold text-gray-500 p-2">Minh chứng khiếu nại:</div>
                      {selected.appealMediaUrl.match(/\.(mp4|mov|webm)$/i)
                        ? <video src={selected.appealMediaUrl} controls className="w-full max-h-[240px]" />
                        : <img src={selected.appealMediaUrl} alt="appeal" className="w-full max-h-[240px] object-contain" />
                      }
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2 flex-wrap">
                {selected.status === "pending" && (
                  <>
                    <button onClick={() => { setModal(null); handleApprove(selected); }} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm">✅ Duyệt</button>
                    <button onClick={() => setModal("warn")} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 text-sm">⚠️ Nhắc nhở</button>
                    <button onClick={() => setModal("fraud")} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm">🚫 Gian lận</button>
                  </>
                )}
                {selected.status === "appealing" && (
                  <button onClick={() => setModal("resolve")} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 text-sm">⚖️ Xét khiếu nại</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nhắc nhở ── */}
      {modal === "warn" && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1">⚠️ Nhắc nhở — {selected.user.fullName}</h2>
            <p className="text-sm text-gray-500 mb-4">Minh chứng ngày <strong>{selected.checkInDate}</strong>. User sẽ nhận tin nhắn và được upload lại.</p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={4}
              placeholder="VD: Video quá ngắn, chưa thấy rõ động tác plank. Vui lòng quay đủ 30 giây."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm">Huỷ</button>
              <button onClick={handleWarn} disabled={!reason.trim()} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-40 text-sm">Gửi nhắc nhở</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Gian lận ── */}
      {modal === "fraud" && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1 text-red-600">🚫 Báo cáo gian lận — {selected.user.fullName}</h2>
            <p className="text-sm text-gray-500 mb-4">Minh chứng ngày <strong>{selected.checkInDate}</strong>. Hành động này sẽ <strong>reset toàn bộ tiến độ</strong> và ban user khỏi sự kiện. User có thể gửi khiếu nại.</p>
            <textarea
              className="w-full border border-red-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={4}
              placeholder="VD: Video sử dụng cùng một đoạn clip, không phải thực hiện trong ngày hôm nay."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm">Huỷ</button>
              <button onClick={handleFraud} disabled={!reason.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-40 text-sm">Xác nhận gian lận</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Xét khiếu nại ── */}
      {modal === "resolve" && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1 text-purple-600">⚖️ Xét khiếu nại — {selected.user.fullName}</h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-sm text-purple-800">
              <strong>Lý do khiếu nại:</strong> {selected.appealNote || "Không có ghi chú"}
            </div>

            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={resolveDecision === "restore"} onChange={() => setResolveDecision("restore")} className="accent-green-600" />
                <span className="text-sm font-medium text-green-700">✅ Phục hồi tiến độ — Chấp nhận khiếu nại</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={resolveDecision === "keep_ban"} onChange={() => setResolveDecision("keep_ban")} className="accent-red-600" />
                <span className="text-sm font-medium text-red-700">🚫 Giữ nguyên ban — Từ chối khiếu nại</span>
              </label>
            </div>

            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={3}
              placeholder="Ghi chú quyết định (tuỳ chọn)..."
              value={appealNote}
              onChange={(e) => setAppealNote(e.target.value)}
            />

            <div className="flex gap-3 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm">Huỷ</button>
              <button
                onClick={handleResolveAppeal}
                className={`flex-1 py-2 text-white rounded-lg font-semibold text-sm ${resolveDecision === "restore" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {resolveDecision === "restore" ? "✅ Phục hồi" : "🚫 Giữ ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
