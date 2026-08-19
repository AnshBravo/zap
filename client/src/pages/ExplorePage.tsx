import React, { useState } from "react";
import {
  Search,
  TrendingUp,
  Sparkles,
  UserPlus,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrendItem {
  id: string;
  category: string;
  topic: string;
  postsCount: string;
}

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  isFollowing: boolean;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "top" | "trending" | "news" | "people"
  >("top");

  // Mock Trending Data
  const [trends] = useState<TrendItem[]>([
    {
      id: "t-1",
      category: "Technology · Trending",
      topic: "#React19",
      postsCount: "42.5K Zaps",
    },
    {
      id: "t-2",
      category: "Web Development",
      topic: "Tailwind CSS v4",
      postsCount: "28.1K Zaps",
    },
    {
      id: "t-3",
      category: "Design System",
      topic: "#Minimalism",
      postsCount: "15.4K Zaps",
    },
    {
      id: "t-4",
      category: "AI & Future",
      topic: "Local LLMs",
      postsCount: "89.2K Zaps",
    },
    {
      id: "t-5",
      category: "Software Engineering",
      topic: "#TypeScript",
      postsCount: "34.8K Zaps",
    },
  ]);

  // Mock Suggested Users Data
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([
    {
      id: "u-1",
      username: "shadcn",
      displayName: "shadcn",
      bio: "Designing re-usable UI components for the modern web.",
      isFollowing: false,
    },
    {
      id: "u-2",
      username: "dan_abramov",
      displayName: "Dan Abramov",
      bio: "Working on React. Writing code and essays.",
      isFollowing: false,
    },
    {
      id: "u-3",
      username: "vercel",
      displayName: "Vercel",
      bio: "Develop. Preview. Ship. Creator of Next.js.",
      isFollowing: true,
    },
  ]);

  const toggleFollow = (userId: string) => {
    setSuggestedUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user,
      ),
    );
  };

  const filteredTrends = trends.filter(
    (item) =>
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Search Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark p-4 space-y-3">
        <div className="relative flex items-center">
          <Search
            size={18}
            className="absolute left-3.5 text-pure-gray-light dark:text-pure-gray-dark"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Zaps, topics, or people..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-black dark:text-white placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark font-medium"
          />
        </div>

        {/* Explore Tabs */}
        <div className="flex pt-1 gap-2 overflow-x-auto no-scrollbar">
          {(["top", "trending", "news", "people"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 ${
                activeTab === tab
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-pure-hover-light dark:bg-pure-hover-dark text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
        {/* Banner Section */}
        {activeTab === "top" && !searchQuery && (
          <div className="p-6 relative overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 border-b border-pure-border-light dark:border-pure-border-dark">
            <div className="relative z-10 space-y-2 max-w-sm">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles size={12} /> What's Happening
              </span>
              <h2 className="text-xl font-black tracking-tight leading-tight">
                React 19 Release Candidate is Live
              </h2>
              <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark font-medium leading-relaxed">
                Explore the latest features including Actions, useActionState,
                and server components.
              </p>
            </div>
          </div>
        )}

        {/* Trending Section */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black flex items-center gap-2">
              <TrendingUp size={16} />
              {searchQuery ? "Search Results" : "Trending Now"}
            </h3>
          </div>

          <div className="space-y-1">
            <AnimatePresence>
              {filteredTrends.length > 0 ? (
                filteredTrends.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl hover:bg-pure-hover-light/60 dark:hover:bg-pure-hover-dark/60 transition-colors flex justify-between items-start group cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-pure-gray-light dark:text-pure-gray-dark">
                        {idx + 1} · {item.category}
                      </p>
                      <p className="text-sm font-black text-black dark:text-white group-hover:underline">
                        {item.topic}
                      </p>
                      <p className="text-[11px] text-pure-gray-light dark:text-pure-gray-dark font-medium">
                        {item.postsCount}
                      </p>
                    </div>
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark text-pure-gray-light dark:text-pure-gray-dark transition-all">
                      <MoreHorizontal size={16} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-xs font-medium text-pure-gray-light dark:text-pure-gray-dark">
                  No matching topics found for "{searchQuery}".
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Suggested Accounts Section */}
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-black px-2">Who to Follow</h3>
          <div className="space-y-3">
            {suggestedUsers.map((sUser) => (
              <div
                key={sUser.id}
                className="p-3 rounded-xl border border-pure-border-light dark:border-pure-border-dark flex items-center justify-between gap-3 hover:bg-pure-hover-light/30 dark:hover:bg-pure-hover-dark/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm uppercase shrink-0">
                    {sUser.username.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold truncate text-black dark:text-white">
                      {sUser.displayName}
                    </p>
                    <p className="text-[11px] text-pure-gray-light dark:text-pure-gray-dark truncate font-medium">
                      @{sUser.username}
                    </p>
                    <p className="text-[11px] text-black dark:text-white line-clamp-1 mt-0.5 font-normal">
                      {sUser.bio}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleFollow(sUser.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
                    sUser.isFollowing
                      ? "bg-pure-hover-light dark:bg-pure-hover-dark text-black dark:text-white border border-pure-border-light dark:border-pure-border-dark"
                      : "bg-black text-white dark:bg-white dark:text-black"
                  }`}
                >
                  {sUser.isFollowing ? (
                    <>
                      <Check size={14} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Follow
                    </>
                  )}
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
