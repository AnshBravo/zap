import { Loader2 } from "lucide-react";
import PostCard from "../components/feed/PostCard";
import { usePostFeed } from "../hooks/usePostFeed";

export default function FeedPage() {
  const {
    posts,
    pagination,
    loading,
    loadingMore,
    error,
    retry,
    loadMore,
    removePost,
    updateCommentCount,
  } = usePostFeed(
    20,
    true,
    "Failed to load Zaps. Please try again later.",
  );

  return (
    <div className="min-h-screen w-full">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-10 border-b border-pure-border-light bg-white/90 px-6 py-4 backdrop-blur dark:border-pure-border-dark dark:bg-black/90">
        <h1 className="text-lg font-bold tracking-tight">Home</h1>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading posts</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-red-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void retry()}
            className="mt-3 border border-current px-4 py-2 font-semibold"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center text-xs text-pure-gray-light dark:text-pure-gray-dark font-medium">
          No Zaps yet. Be the first to share something!
        </div>
      ) : (
        <div className="mx-auto max-w-157.5 divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={removePost}
              onCommentCountChange={updateCommentCount}
            />
          ))}
          {pagination?.hasNextPage && (
            <div className="py-6 text-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {loadingMore && <Loader2 size={14} className="animate-spin" />}
                {loadingMore ? "Loading" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
