import { useState, useEffect } from "react";
import {
  Search,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react";
import { postsApi } from "../api/posts";
import { usersApi } from "../api/users";
import type { Post, User } from "../types";
import { useAuth } from "../context/AuthContext";

export default function ExplorePage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load global feed on mount
  useEffect(() => {
    fetchGlobalPosts();
  }, []);

  const fetchGlobalPosts = async () => {
    try {
      setLoading(true);
      const res = await postsApi.getFeed(1, 20);
      setPosts(res.data.posts);
    } catch (err) {
      console.error("Failed to fetch explore posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle live user search on query submit or input
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim().replace(/^@/, "");
    if (!cleanQuery) {
      setSearchedUser(null);
      setSearchError(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const res = await usersApi.getProfile(cleanQuery);
      setSearchedUser(res.data.user);
      setIsFollowing(false);
    } catch (err: any) {
      setSearchedUser(null);
      setSearchError(
        err?.response?.data?.message || "No user found with that username.",
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await postsApi.toggleLike(postId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const currentLikes = post._count?.likes || 0;
            return {
              ...post,
              _count: {
                ...post._count,
                likes: res.liked
                  ? currentLikes + 1
                  : Math.max(0, currentLikes - 1),
              },
            };
          }
          return post;
        }),
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (followLoading) return;
    try {
      setFollowLoading(true);
      const res = await usersApi.toggleFollow(targetUserId);
      setIsFollowing(res.following);
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Filter posts based on search query if typing
  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full min-h-screen">
      {/* Search Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-4 py-3">
        <form onSubmit={handleSearch} className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pure-gray-light dark:text-pure-gray-dark"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Zaps or @usernames..."
            className="w-full pl-10 pr-4 py-2 bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark rounded-full text-xs sm:text-sm outline-none focus:border-black dark:focus:border-white transition-colors"
          />
        </form>
      </div>

      {/* Searched User Result Card */}
      {searchLoading ? (
        <div className="p-6 text-center text-xs text-pure-gray-light dark:text-pure-gray-dark flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Searching user...
        </div>
      ) : searchedUser ? (
        <div className="p-4 border-b border-pure-border-light dark:border-pure-border-dark bg-pure-hover-light/50 dark:bg-pure-hover-dark/50">
          <p className="text-xs font-bold text-pure-gray-light dark:text-pure-gray-dark mb-2 uppercase tracking-wider">
            User Result
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold uppercase text-sm">
                {searchedUser.avatarUrl ? (
                  <img
                    src={searchedUser.avatarUrl}
                    alt={searchedUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  searchedUser.username.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">@{searchedUser.username}</h3>
                {searchedUser.bio && (
                  <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark line-clamp-1">
                    {searchedUser.bio}
                  </p>
                )}
              </div>
            </div>

            {currentUser?.id !== searchedUser.id && (
              <button
                onClick={() => handleToggleFollow(searchedUser.id)}
                disabled={followLoading}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isFollowing
                    ? "border border-pure-border-light dark:border-pure-border-dark"
                    : "bg-black text-white dark:bg-white dark:text-black"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : searchError && searchQuery.startsWith("@") ? (
        <div className="p-4 text-center text-xs text-red-500 border-b border-pure-border-light dark:border-pure-border-dark">
          {searchError}
        </div>
      ) : null}

      {/* Explore / Global Feed Section */}
      <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
        <div className="px-4 py-3 bg-pure-hover-light/30 dark:bg-pure-hover-dark/30">
          <h2 className="text-sm font-bold tracking-tight">
            Explore Recent Zaps
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-pure-gray-light dark:text-pure-gray-dark flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Loading Zaps...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-xs text-pure-gray-light dark:text-pure-gray-dark">
            No Zaps found matching "{searchQuery}".
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 space-y-2 hover:bg-pure-hover-light/40 dark:hover:bg-pure-hover-dark/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm">
                  @{post.author.username}
                </span>
                <span className="text-[10px] sm:text-xs text-pure-gray-light dark:text-pure-gray-dark">
                  • {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed">
                {post.content}
              </p>

              <div className="flex items-center gap-6 pt-2 text-xs text-pure-gray-light dark:text-pure-gray-dark">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                >
                  <Heart size={15} />
                  <span>{post._count?.likes || 0}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={15} />
                  <span>{post._count?.comments || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
