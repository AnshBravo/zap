import { useEffect, useState } from "react";
import { Heart, Loader2, MessageCircle, X } from "lucide-react";
import PostCard from "../components/feed/PostCard";
import { postsApi } from "../api/posts";
import { getApiErrorMessage } from "../api/errors";
import type { Post } from "../types";

export default function ExploreGridPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    let cancelled = false;
    postsApi
      .getFeed(1, 50)
      .then((response) => {
        if (!cancelled) setPosts(response.data.posts);
      })
      .catch((requestError: unknown) => {
        if (!cancelled)
          setError(
            getApiErrorMessage(requestError, "Explore could not be loaded."),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-pure-border-light bg-white/90 px-5 py-4 backdrop-blur dark:border-pure-border-dark dark:bg-black/90">
        <h1 className="text-lg font-bold">Explore</h1>
        <p className="mt-1 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          Recent posts from the community
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading posts</span>
        </div>
      ) : error ? (
        <p role="alert" className="p-10 text-center text-sm text-red-600">
          {error}
        </p>
      ) : posts.length ? (
        <div className="grid grid-cols-3 gap-px bg-pure-border-light dark:bg-pure-border-dark">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPost(post)}
              aria-label={`Open post by @${post.author.username}`}
              className="group relative aspect-square overflow-hidden bg-white text-left dark:bg-black"
            >
              {post.mediaUrl ? (
                /\.(mp4|webm)(?:$|\?)/i.test(post.mediaUrl) ? (
                  <video
                    src={post.mediaUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <span className="line-clamp-6 block p-3 text-xs text-black sm:p-5 sm:text-sm dark:text-white">
                  {post.content}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center gap-5 bg-black/55 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span>
                  <Heart size={17} className="mr-1.5 inline" />
                  {post._count.likes}
                </span>
                <span>
                  <MessageCircle size={17} className="mr-1.5 inline" />
                  {post._count.comments}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="p-10 text-center text-sm text-pure-gray-light dark:text-pure-gray-dark">
          No posts to explore yet.
        </p>
      )}

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-8"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white dark:bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              aria-label="Close post"
              className="absolute right-2 top-2 z-10 bg-black/70 p-2 text-white"
            >
              <X size={16} />
            </button>
            <PostCard
              post={selectedPost}
              onDelete={(postId) => {
                setPosts((current) =>
                  current.filter((post) => post.id !== postId),
                );
                setSelectedPost(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
