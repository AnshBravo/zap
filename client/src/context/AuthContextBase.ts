import { createContext } from "react";
import type { AuthState, User } from "../types";

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
