import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, UserPlus } from "lucide-react";
import { postsApi } from "../../api/posts";
import type { Post } from "../../types";

export function RightWidgetSidebar() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const response = await postsApi.getFeed(1, 20);
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error("Failed to load sidebar feed:", error);
      }
    };

    loadFeed();
  }, []);

  const trends = useMemo(() => {
    const tagMap = new Map<string, number>();

    posts.forEach((post) => {
      const matches = post.content.match(/#\w+/g) || [];
      matches.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    return [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag, count]) => ({
        tag,
        posts: `${count} ${count === 1 ? "Zap" : "Zaps"}`,
      }));
  }, [posts]);

  const creators = useMemo(() => {
    const uniqueAuthors = new Map<string, string>();

    posts.forEach((post) => {
      if (!uniqueAuthors.has(post.author.username)) {
        uniqueAuthors.set(post.author.username, post.author.id);
      }
    });

    return [...uniqueAuthors.entries()].slice(0, 3).map(([username]) => ({
      username,
      id: username,
    }));
  }, [posts]);

  return (
    <aside className="sticky top-0 h-screen w-80 xl:w-96 hidden lg:flex flex-col gap-6 p-6 border-l border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black shrink-0 overflow-y-auto transition-colors">
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

      <div className="p-4 rounded-2xl border border-pure-border-light dark:border-pure-border-dark space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <TrendingUp size={16} />
          <span>Trending Today</span>
        </div>
        <div className="space-y-3 pt-1">
          {trends.length > 0 ? (
            trends.map((trend) => (
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
            ))
          ) : (
            <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
              No active trends yet.
            </p>
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-pure-border-light dark:border-pure-border-dark space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <UserPlus size={16} />
          <span>Who to Follow</span>
        </div>
        <div className="space-y-3 pt-1">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {creator.username.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold truncate">
                    @{creator.username}
                  </span>
                </div>
                <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity">
                  Follow
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
              Follow suggestions will appear here.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
