import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import PostComposer from "../components/feed/PostComposer";
import PostCard from "../components/feed/PostCard";
import { postsApi } from "../api/posts";
import { type Post } from "../types";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await postsApi.getFeed(1, 20);
      setPosts(res.data.posts);
    } catch (err: any) {
      console.error("Failed to fetch feed:", err);
      setError("Failed to load Zaps. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Called when a new Zap is successfully created in PostComposer
  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-6 py-3">
        <h1 className="text-lg font-black tracking-tight">Home</h1>
      </div>

      {/* Post Creation Area */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Feed List */}
      {loading ? (
        <div className="p-12 flex items-center justify-center gap-2 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          <Loader2
            className="animate-spin text-black dark:text-white"
            size={18}
          />
          <span>Loading Zaps...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-red-500">{error}</div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center text-xs text-pure-gray-light dark:text-pure-gray-dark font-medium">
          No Zaps yet. Be the first to share something!
        </div>
      ) : (
        <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
