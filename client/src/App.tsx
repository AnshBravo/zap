import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import the routing functions
import { useAuth } from "./context/AuthContext";
import type { ReactElement } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import { AppLayout } from "./components/layout/AppLayout";
import FeedPage from "./pages/FeedPage";
import NotificationsPage from "./pages/NotificationsPage";
import MessagesPage from "./pages/MessagesPage";
import ExplorePage from "./pages/ExplorePage";
import FollowListPage from "./pages/FollowListPage";
// Placeholder pages (Should be replaced later in the process);

// Temporary view components for layout verification

// Protected Route Guard
function ProtectedRoutes({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading Zap...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoutes>
              <AppLayout />
            </ProtectedRoutes>
          }
        >
          <Route path="/" element={<FeedPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route
            path="/profile/:username/followers"
            element={<FollowListPage />}
          />
          <Route
            path="/profile/:username/following"
            element={<FollowListPage />}
          />
          <Route path="/profile/followers" element={<FollowListPage />} />
          <Route path="/profile/following" element={<FollowListPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
