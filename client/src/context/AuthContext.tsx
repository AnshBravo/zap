import React, { useEffect, useState } from "react";
import type { User } from "../types";
import api from "../api/axios";
import { AuthContext } from "./AuthContextBase";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("zap:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("zap:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("zap_token");
      const storedUser = localStorage.getItem("zap_user");

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      let parsedUser: User;

      try {
        parsedUser = JSON.parse(storedUser) as User;

        // Restore cached authentication immediately.
        setUser(parsedUser);
        setToken(storedToken);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to parse cached user:", error);

        localStorage.removeItem("zap_user");
        localStorage.removeItem("zap_token");

        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      // Validate the session in the background.
      try {
        const response = await api.get("/auth/me");
        const freshUser = response.data?.data?.user as User;

        if (isMounted) {
          setUser(freshUser);
          localStorage.setItem("zap_user", JSON.stringify(freshUser));
        }
      } catch (error) {
        console.error("Background session validation failed:", error);

        // Don't clear cached credentials for network errors
        // or temporary server failures.
        // Axios already handles HTTP 401 responses.
      }
    };

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("zap:unauthorized", handleUnauthorized);

    initializeAuth();

    return () => {
      isMounted = false;
      window.removeEventListener("zap:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", {
      email: email,
      password: password,
    });
    const { token: jwtToken } = response.data;
    const { user: userData } = response.data.data; // we're using .data.data as response return an object called data in which our returned payload data is.

    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem("zap_user", JSON.stringify(userData));
    localStorage.setItem("zap_token", jwtToken);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const response = await api.post("/auth/register", {
      username: username,
      email: email,
      password: password,
    });
    const { token: jwtToken } = response.data;
    const { user: userData } = response.data.data;

    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem("zap_user", JSON.stringify(userData));
    localStorage.setItem("zap_token", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("zap_user");
    localStorage.removeItem("zap_token");
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const newUserData = { ...user, ...updatedFields };
    setUser(newUserData);
    localStorage.setItem("zap_user", JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        register,
        login,
        logout,
        updateUser,
        isLoading,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
