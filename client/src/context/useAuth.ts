import { useContext } from "react";
import { AuthContext } from "./AuthContextBase";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used with an AuthProvider");
  }
  return context;
}
