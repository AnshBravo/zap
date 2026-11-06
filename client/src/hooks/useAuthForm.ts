import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/errors";
import { useAuth } from "../context/useAuth";

type AuthFormMode = "login" | "register";

export function useAuthForm(mode: AuthFormMode) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password.trim() || (mode === "register" && !username.trim())) {
      setError("Please fill in all fields.");
      return;
    }
    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "register") {
        await register(username.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          mode === "register"
            ? "Registration failed. Please try again."
            : "Invalid credentials. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    error,
    submitting,
    submit,
  };
}
