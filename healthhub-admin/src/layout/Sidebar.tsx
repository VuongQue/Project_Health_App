import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/users", label: "Users" },
  { to: "/workouts", label: "Workouts" },
  { to: "/posts", label: "Posts" },
  { to: "/achievements", label: "Achievements" },
  { to: "/challenges", label: "Challenges" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow p-4">
      <h1 className="font-bold text-xl mb-6">HealthHub Admin</h1>
      <nav className="space-y-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded ${
                isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
