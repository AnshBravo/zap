import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthState, User } from "../types";
import api from "../api/axios";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  updateUser: (updateUser: Partial<User>) => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("zap_token");
        const storedUser = localStorage.getItem("zap_user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setToken(storedToken);

          const response = await api.get("/auth/me");
          const freshUser = response.data?.data?.user as User;

          if (isMounted) {
            setUser(freshUser);
            localStorage.setItem("zap_user", JSON.stringify(freshUser));
          }
        }
      } catch (error) {
        console.error("failed to restore auth session:", error);
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("zap_user");
          localStorage.removeItem("zap_token");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used with an AuthProvider");
  }
  return context;
};
