import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, Bell, Mail, User } from "lucide-react";

export function MobileNavbar() {
  const items = [
    { path: "/", icon: Home },
    { path: "/explore", icon: Search },
    { path: "/notifications", icon: Bell },
    { path: "/messages", icon: Mail },
    { path: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 lg:hidden border-t border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black flex items-center justify-around px-2 z-50">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={idx}
            to={item.path}
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
    </nav>
  );
}
