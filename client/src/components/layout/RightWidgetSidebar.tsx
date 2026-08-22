import { Search, TrendingUp, UserPlus } from "lucide-react";

export function RightWidgetSidebar() {
  const dummyTrends = [
    { tag: "#React19", posts: "14.2k Zaps" },
    { tag: "#TypeScript", posts: "8.9k Zaps" },
    { tag: "#WebSockets", posts: "5.1k Zaps" },
    { tag: "#TailwindCSS", posts: "12.4k Zaps" },
  ];

  return (
    <aside className="sticky top-0 h-screen w-80 xl:w-96 hidden lg:flex flex-col gap-6 p-6 border-l border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black shrink-0 overflow-y-auto transition-colors">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pure-gray-light dark:text-pure-gray-dark"
        />
        <input
          type="text"
          placeholder="Search Zap..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black text-black dark:text-white placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark focus:outline-none focus:border-black dark:focus:border-white text-sm transition-all"
        />
      </div>

      {/* Trending Box */}
      <div className="p-4 rounded-2xl border border-pure-border-light dark:border-pure-border-dark space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <TrendingUp size={16} />
          <span>Trending Today</span>
        </div>
        <div className="space-y-3 pt-1">
          {dummyTrends.map((trend) => (
            <div
              key={trend.tag}
              className="flex justify-between items-center group cursor-pointer"
            >
              <div>
                <p className="text-sm font-semibold group-hover:underline">
                  {trend.tag}
                </p>
                <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
                  {trend.posts}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who to Follow Box */}
      <div className="p-4 rounded-2xl border border-pure-border-light dark:border-pure-border-dark space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <UserPlus size={16} />
          <span>Who to Follow</span>
        </div>
        <div className="space-y-3 pt-1">
          {["sarah_dev", "alex_code", "design_guru"].map((handle) => (
            <div
              key={handle}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark flex items-center justify-center text-xs font-bold uppercase shrink-0">
                  {handle.charAt(0)}
                </div>
                <span className="text-xs font-semibold truncate">
                  @{handle}
                </span>
              </div>
              <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
