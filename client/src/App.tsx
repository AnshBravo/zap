import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import the routing functions
import { useAuth } from "./context/AuthContext";
import type { ReactElement } from "react";
// Placeholder pages (Should be replaced later in the process);

const DummyHome = () => (
  <div className="p-8 font-bold">Home Feed (Protected)</div>
);
const DummyLogin = () => <div className="p-8 font-bold">Login Page</div>;
const DummyRegister = () => <div className="p-8 font-bold">Register Page</div>;

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
        <Route path="/login" element={<DummyLogin />} />
        <Route path="/register" element={<DummyRegister />} />
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <DummyHome />
            </ProtectedRoutes>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
