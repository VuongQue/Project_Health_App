import { useEffect, useState } from "react";
import { getPosts, hidePost, deletePost } from "../api/admin.api";

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);

  const load = async () => {
    const res = await getPosts({ page: 1, limit: 20 });
    setPosts(res.data.items);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Community Posts</h2>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Content</th>
            <th className="p-2">User</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {posts.map((p) => (
            <tr key={p._id} className="border-b">
              <td className="p-2 truncate max-w-md">{p.content}</td>
              <td className="p-2">{p.user?.name}</td>
              <td className="p-2 space-x-2">
                <button
                  className="text-yellow-600"
                  onClick={() => hidePost(p._id).then(load)}
                >
                  Hide
                </button>

                <button
                  className="text-red-500"
                  onClick={() => deletePost(p._id).then(load)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
