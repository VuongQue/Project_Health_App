import { useEffect, useState } from "react";
import { getUsers, lockUser, unlockUser } from "../api/admin.api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    const res = await getUsers({});
    setUsers(res.data.items);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Users</h2>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.status}</td>
              <td className="p-2 space-x-2">
                {u.status === "ACTIVE" ? (
                  <button
                    className="text-red-500"
                    onClick={() => lockUser(u.id).then(load)}
                  >
                    Lock
                  </button>
                ) : (
                  <button
                    className="text-green-500"
                    onClick={() => unlockUser(u.id).then(load)}
                  >
                    Unlock
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
