import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  PageTransition,
  FadeIn,
  AnimatedAlert,
} from "../components/common/Animations";
import LogoBlack from "../assets/Zap logo black.png";
import LogoWhite from "../assets/Zap logo white.png";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="min-h-screen flex flex-col justify-center items-center bg-white dark:bg-black text-black dark:text-white p-4 transition-colors">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-full border border-pure-border-light dark:border-pure-border-dark hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>
      </div>

      {/* Login Card */}
      <FadeIn className="w-full max-w-md bg-white dark:bg-black border border-pure-border-light dark:border-pure-border-dark rounded-2xl p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <img
            src={theme === "dark" ? LogoBlack : LogoWhite}
            alt="Zap"
            className="h-24 mx-auto transition-all duration-300"
          />
          <p className="text-sm text-pure-gray-light dark:text-pure-gray-dark mt-2">
            Welcome back. Log in to your account.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <AnimatedAlert>
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl border border-black dark:border-white bg-pure-hover-light dark:bg-pure-hover-dark text-black dark:text-white text-sm font-medium">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          </AnimatedAlert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-gray-light dark:text-pure-gray-dark mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-4 py-3 rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-gray-light dark:text-pure-gray-dark mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              "Logging in..."
            ) : (
              <>
                Log In <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-pure-gray-light dark:text-pure-gray-dark">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-black dark:text-white underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            Register
          </Link>
        </div>
      </FadeIn>
    </PageTransition>
  );
}
