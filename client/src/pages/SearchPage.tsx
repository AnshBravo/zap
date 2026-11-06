import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, UserCheck, UserPlus } from "lucide-react";
import PostCard from "../components/feed/PostCard";
import { useAuth } from "../context/useAuth";
import { useSearch } from "../hooks/useSearch";

type SearchTab = "people" | "posts";

export default function SearchPage() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("people");
  const {
    users,
    posts,
    loading,
    error,
    followingIds,
    pendingId,
    search: searchUsersAndPosts,
    toggleFollow,
    removePost,
  } = useSearch();

  const search = async (event: FormEvent) => {
    event.preventDefault();
    await searchUsersAndPosts(query);
  };

  return (
    <section className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-pure-border-light bg-white/90 px-5 py-4 backdrop-blur dark:border-pure-border-dark dark:bg-black/90">
        <h1 className="mb-4 text-lg font-bold">Search</h1>
        <form onSubmit={search} className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pure-gray-light dark:text-pure-gray-dark"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="People or posts"
            aria-label="Search people or posts"
            className="w-full rounded-full border border-pure-border-light bg-pure-hover-light py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black dark:border-pure-border-dark dark:bg-pure-hover-dark dark:focus:border-white"
          />
        </form>
      </header>

      <div className="flex border-b border-pure-border-light dark:border-pure-border-dark">
        {(["people", "posts"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 border-b-2 py-3 text-sm font-semibold capitalize ${activeTab === tab ? "border-black dark:border-white" : "border-transparent text-pure-gray-light dark:text-pure-gray-dark"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="px-5 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : activeTab === "people" ? (
        users.length ? (
          <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
            {users.map((user) => {
              const isFollowing = followingIds.has(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <Link
                    to={`/profile/${user.username}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-black text-sm font-bold uppercase text-white dark:bg-white dark:text-black">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.username[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="truncate text-xs text-pure-gray-light dark:text-pure-gray-dark">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                  {currentUser?.id !== user.id && (
                    <button
                      type="button"
                      disabled={pendingId === user.id}
                      onClick={() => void toggleFollow(user.id)}
                      className={`flex shrink-0 items-center gap-1.5 border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${isFollowing ? "border-pure-border-light dark:border-pure-border-dark" : "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"}`}
                    >
                      {isFollowing ? (
                        <UserCheck size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-pure-gray-light dark:text-pure-gray-dark">
            No people found.
          </p>
        )
      ) : posts.length ? (
        <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={removePost}
            />
          ))}
        </div>
      ) : (
        <p className="p-10 text-center text-sm text-pure-gray-light dark:text-pure-gray-dark">
          No posts found.
        </p>
      )}
    </section>
  );
}
