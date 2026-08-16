import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import the routing functions
import { useAuth } from "./context/AuthContext";
import type { ReactElement } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AppLayout } from "./components/layout/AppLayout";

// Placeholder pages (Should be replaced later in the process);

const DummyHome = () => (
  <div className="p-8 font-bold">Home Feed (Protected)</div>
);

// Temporary view components for layout verification
const FeedPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-extrabold tracking-tight mb-4">Home Feed</h2>
    <div className="p-4 border border-pure-border-light dark:border-pure-border-dark rounded-xl">
      <p className="text-sm font-medium">
        Welcome to Zap! The 3-column layout is fully responsive and active.
      </p>
    </div>
  </div>
);

const ExplorePage = () => (
  <div className="p-6 text-xl font-extrabold">Explore View</div>
);
const NotificationsPage = () => (
  <div className="p-6 text-xl font-extrabold font-sans">Notifications View</div>
);
const MessagesPage = () => (
  <div className="p-6 text-xl font-extrabold">Messages View</div>
);
const ProfilePage = () => (
  <div className="p-6 text-xl font-extrabold">Profile View</div>
);

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

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
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
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
