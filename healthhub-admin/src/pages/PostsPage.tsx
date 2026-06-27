import { useEffect, useState } from "react";
import { adminPostsApi } from "../api/admin.api";
import type { CommunityPost } from "../api/admin.api";


export default function PostsPage() {
  const [items, setItems] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const load = async (p = page) => {
    const res = await adminPostsApi.list({ page: p, limit });
    setItems(res.data.items);
    setTotal(res.data.total);
    setPage(res.data.page);
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bài đăng cộng đồng</h2>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Nội dung</th>
            <th className="p-2">Người đăng</th>
            <th className="p-2">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {items.map((p) => (
            <tr key={p._id} className="border-b">
              <td className="p-2 truncate max-w-md">{p.content}</td>
              <td className="p-2">{p.user?.name || p.user?.fullName || p.user?.email}</td>
              <td className="p-2 space-x-2">
                {p.isHidden ? (
                  <button className="text-green-600" onClick={() => adminPostsApi.unhide(p._id).then(() => load())}>
                    Bỏ ẩn
                  </button>
                ) : (
                  <button className="text-yellow-600" onClick={() => adminPostsApi.hide(p._id).then(() => load())}>
                    Ẩn bài
                  </button>
                )}

                <button className="text-red-500" onClick={() => adminPostsApi.remove(p._id).then(() => load())}>
                  Xoá
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center gap-2">
        <button className="border rounded px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => load(page - 1)}>
          Trước
        </button>
        <span className="text-sm text-gray-600">Trang {page} / {totalPages || 1}</span>
        <button className="border rounded px-3 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={() => load(page + 1)}>
          Tiếp
        </button>
      </div>
    </div>
  );
}
