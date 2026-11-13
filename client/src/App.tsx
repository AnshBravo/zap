import { lazy, Suspense } from "react";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { domAnimation, LazyMotion } from "framer-motion";
import { useAuth } from "./context/useAuth";
import type { ReactElement } from "react";
import { AppLayout } from "./components/layout/AppLayout";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ExplorePage = lazy(() => import("./pages/ExploreGridPage"));
const FollowListPage = lazy(() => import("./pages/FollowListPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ShortiesPage = lazy(() => import("./pages/ShortiesPage"));

const SocketProvider = lazy(() =>
  import("./context/SocketContext").then((module) => ({
    default: module.SocketProvider,
  })),
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <LazyMotion features={domAnimation} strict>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              Loading Zap...
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoutes>
                  <SocketProvider>
                    <AppLayout />
                  </SocketProvider>
                </ProtectedRoutes>
              }
            >
              <Route path="/" element={<FeedPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/shorties" element={<ShortiesPage />} />
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
        </Suspense>
      </LazyMotion>
    </BrowserRouter>
  );
}
