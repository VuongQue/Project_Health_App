import { useEffect, useState } from "react";
import { adminUsersApi } from "../api/admin.api";
import type { AdminUser, UserDetail } from "../api/admin.api";

export default function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminUsersApi.list({ keyword, page: p, limit });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLockToggle = async (u: AdminUser) => {
    if (!confirm(u.status === "ACTIVE" ? `Khoá tài khoản ${u.email}?` : `Mở khoá ${u.email}?`)) return;
    if (u.status === "ACTIVE") await adminUsersApi.lock(u.id);
    else await adminUsersApi.unlock(u.id);
    load();
    if (detailUser?.id === u.id) openDetail(u.id);
  };

  const onChangeRole = async (u: AdminUser, role: AdminUser["role"]) => {
    await adminUsersApi.setRole(u.id, role);
    load();
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await adminUsersApi.detail(id);
      setDetailUser(res.data as UserDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status: string) => {
    const isActive = status === "ACTIVE";
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
        {isActive ? "Hoạt động" : "Bị khoá"}
      </span>
    );
  };

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Quản trị viên",
    TRAINER: "Huấn luyện viên",
    MODERATOR: "Kiểm duyệt viên",
    USER: "Người dùng",
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700",
      TRAINER: "bg-blue-100 text-blue-700",
      MODERATOR: "bg-orange-100 text-orange-700",
      USER: "bg-gray-100 text-gray-600",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] ?? "bg-gray-100"}`}>{ROLE_LABELS[role] ?? role}</span>;
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Main table */}
      <div className={`flex-1 min-w-0 transition-all ${detailUser ? "max-w-[calc(100%-320px)]" : ""}`}>
        <h2 className="text-xl font-bold mb-4">Quản lý người dùng</h2>

        <div className="mb-4 flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
            placeholder="Tìm email / username / tên"
            className="border px-3 py-2 rounded w-72"
          />
          <button onClick={() => load(1)} className="px-4 py-2 bg-blue-500 text-white rounded">
            Tìm
          </button>
        </div>

        {loading && <div className="mb-2 text-gray-500 text-sm">Đang tải...</div>}

        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left border-b text-sm text-gray-600">
                <th className="p-3">Email</th>
                <th className="p-3">Tên</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Cảnh cáo</th>
                <th className="p-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b hover:bg-gray-50 text-sm cursor-pointer ${detailUser?.id === u.id ? "bg-blue-50" : ""}`}
                  onClick={() => openDetail(u.id)}
                >
                  <td className="p-3 font-medium text-blue-700">{u.email}</td>
                  <td className="p-3 text-gray-700">{u.fullName || u.username || "—"}</td>
                  <td className="p-3">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={u.role}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); onChangeRole(u, e.target.value as any); }}
                    >
                      <option value="USER">Người dùng</option>
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="TRAINER">Huấn luyện viên</option>
                      <option value="MODERATOR">Kiểm duyệt viên</option>
                    </select>
                  </td>
                  <td className="p-3">{statusBadge(u.status)}</td>
                  <td className="p-3">
                    {(u as any).warningCount > 0 ? (
                      <span className="text-orange-600 font-bold text-xs">⚠️ {(u as any).warningCount}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">0</span>
                    )}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`text-sm font-medium ${u.status === "ACTIVE" ? "text-red-500 hover:underline" : "text-green-600 hover:underline"}`}
                      onClick={() => onLockToggle(u)}
                    >
                      {u.status === "ACTIVE" ? "Khoá" : "Mở khoá"}
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">Không có người dùng</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center gap-2">
          <button className="border rounded px-3 py-1 text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => load(page - 1)}>Trước</button>
          <span className="text-sm text-gray-600">Trang {page} / {totalPages || 1} (Tổng {total})</span>
          <button className="border rounded px-3 py-1 text-sm disabled:opacity-50" disabled={page >= totalPages} onClick={() => load(page + 1)}>Tiếp</button>
        </div>
      </div>

      {/* Detail Drawer */}
      {detailUser && (
        <div className="w-80 bg-white shadow-lg rounded-xl p-5 shrink-0 self-start sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">Chi tiết người dùng</h3>
            <button onClick={() => setDetailUser(null)} className="text-gray-400 hover:text-gray-700">✖</button>
          </div>

          {detailLoading ? (
            <div className="text-gray-400 text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-3 text-sm">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {(detailUser.fullName || detailUser.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{detailUser.fullName || detailUser.username || "—"}</div>
                  <div className="text-gray-500 text-xs">{detailUser.email}</div>
                </div>
              </div>

              {/* Role & Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Vai trò</span>
                {roleBadge(detailUser.role)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Trạng thái</span>
                {statusBadge(detailUser.status)}
              </div>

              {/* Warnings */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Cảnh cáo</span>
                <span className={`font-bold ${(detailUser.warningCount ?? 0) > 0 ? "text-orange-600" : "text-gray-400"}`}>
                  {detailUser.warningCount ?? 0} / 3
                </span>
              </div>

              {/* BannedUntil */}
              {detailUser.bannedUntil && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Khoá đến</span>
                  <span className="text-red-600 font-medium">
                    {new Date(detailUser.bannedUntil).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}

              {/* Level & Points */}
              {(detailUser.level != null || detailUser.points != null) && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-500">Level / Điểm</span>
                  <span className="font-medium">Lv.{detailUser.level ?? 1} · {detailUser.points ?? 0} pts</span>
                </div>
              )}

              {/* Dates */}
              <div className="pt-2 border-t space-y-1 text-xs text-gray-400">
                <div>Tham gia: {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString("vi-VN") : "—"}</div>
                <div>Cập nhật: {detailUser.updatedAt ? new Date(detailUser.updatedAt).toLocaleDateString("vi-VN") : "—"}</div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t flex gap-2">
                <button
                  className={`flex-1 py-2 rounded text-sm font-medium ${detailUser.status === "ACTIVE" ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}`}
                  onClick={() => onLockToggle(detailUser)}
                >
                  {detailUser.status === "ACTIVE" ? "Khoá tài khoản" : "Mở khoá"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
