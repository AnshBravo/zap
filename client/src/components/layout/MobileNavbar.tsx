import { NavLink } from "react-router-dom";
import {
  Home,
  Search,
  Compass,
  Clapperboard,
  Bell,
  Mail,
  User,
  PlusSquare,
} from "lucide-react";

export function MobileNavbar({ onCreatePost }: { onCreatePost: () => void }) {
  const items = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/shorties", icon: Clapperboard, label: "Shorties" },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/messages", icon: Mail, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 lg:hidden border-t border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black flex items-center justify-around px-2 z-50">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            aria-label={item.label}
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-colors ${
                isActive
                  ? "text-black dark:text-white font-bold"
                  : "text-pure-gray-light dark:text-pure-gray-dark"
              }`
            }
          >
            <Icon size={22} />
          </NavLink>
        );
      })}
      <button
        type="button"
        onClick={onCreatePost}
        aria-label="Create post"
        className="p-2.5 text-black dark:text-white"
      >
        <PlusSquare size={22} />
      </button>
    </nav>
  );
}
