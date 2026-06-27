import { createBrowserRouter } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import PostsPage from "./pages/PostsPage";
import AchievementsPage from "./pages/AchievementsPage";
import ChallengesPage from "./pages/ChallengesPage";
import ReportsPage from "./pages/ReportsPage";
import EventsPage from "./pages/EventsPage";
import EventSubmissionsPage from "./pages/EventSubmissionsPage";
import LoginPage from "./auth/LoginPage";
import RequireAdmin from "./auth/RequireAdmin";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <UsersPage /> },
      { path: "workouts", element: <WorkoutsPage /> },
      { path: "posts", element: <PostsPage /> },
      { path: "achievements", element: <AchievementsPage /> },
      { path: "challenges", element: <ChallengesPage /> },
      { path: "events", element: <EventsPage /> },
      { path: "events/:id/submissions", element: <EventSubmissionsPage /> },
      { path: "reports", element: <ReportsPage /> },
    ],
  },
]);
