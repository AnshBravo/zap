import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  LogOut,
  Sun,
  Moon,
  PlusSquare,
} from "lucide-react";
import { motion } from "framer-motion";

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Explore", path: "/explore", icon: Search },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Messages", path: "/messages", icon: Mail },
    {
      label: "Profile",
      path: user ? `/profile/${user.username}` : "/profile",
      icon: User,
    },
  ];

  return (
    <aside className="sticky top-0 h-screen w-20 xl:w-64 flex flex-col justify-between p-3 xl:p-6 border-r border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black shrink-0 transition-colors">
      {/* Top Branding & Navigation */}
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <span className="text-2xl">Zap</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                      : "text-black dark:text-white hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark"
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Post Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/", { state: { focusComposer: true } })}
          className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <PlusSquare size={18} />
          <span className="hidden xl:inline">Create a Post</span>
        </motion.button>
      </div>

      {/* Bottom Profile & Utilities */}
      <div className="flex flex-col gap-2 pt-4 border-t border-pure-border-light dark:border-pure-border-dark">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="hidden xl:inline">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors"
        >
          <LogOut size={20} />
          <span className="hidden xl:inline">Log Out</span>
        </button>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 p-2 mt-2 rounded-xl bg-pure-hover-light dark:bg-pure-hover-dark">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user.username.charAt(0)}
            </div>
            <div className="hidden xl:flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">
                {user.username}
              </span>
              <span className="text-[11px] text-pure-gray-light dark:text-pure-gray-dark truncate">
                {user.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
