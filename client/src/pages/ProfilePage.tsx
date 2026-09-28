import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  Calendar,
  Edit3,
  Loader2,
  Heart,
  MessageSquare,
  Grid,
  Bookmark,
  Clapperboard,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { usersApi } from "../api/users";
import { postsApi } from "../api/posts";
import { getApiErrorMessage } from "../api/errors";
import type { Post, User } from "../types";
import EditProfileModal from "../components/EditProfileModal";
import PostCard from "../components/feed/PostCard";

export default function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"posts" | "shorties" | "saved">(
    "posts",
  );
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  // Tab Content States
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [tabError, setTabError] = useState<string | null>(null);

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = Boolean(
    !username || (currentUser?.username && username === currentUser.username),
  );

  const handleProfilePostDeleted = (postId: string) => {
    setProfilePosts((prev) => prev.filter((post) => post.id !== postId));
    setProfile((current) =>
      current
        ? {
            ...current,
            _count: {
              ...current._count,
              posts: Math.max(0, (current._count?.posts ?? 0) - 1),
            },
          }
        : current,
    );
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      if (!targetUsername) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await usersApi.getProfile(targetUsername);

        if (isMounted) {
          const targetUser: User = res.data.user;
          setProfile(targetUser);
          setFollowersCount(targetUser._count?.followers ?? 0);
          setFollowingCount(targetUser._count?.following ?? 0);
          setIsFollowing(targetUser.isFollowing ?? false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Failed to fetch profile:", err);
          setError(getApiErrorMessage(err, "User profile not found."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [targetUsername]);

  const activeProfileTab =
    !isOwnProfile && activeTab === "saved" ? "posts" : activeTab;

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const request =
      activeProfileTab === "saved"
        ? postsApi.getBookmarks(1, 50)
        : usersApi.getUserPosts(profile.username, 1, 50);

    request
      .then((response) => {
        if (cancelled) return;
        const posts = response.data.posts || [];
        setProfilePosts(
          activeProfileTab === "shorties"
            ? posts.filter((post) =>
                /\.(mp4|webm)(?:$|\?)/i.test(post.mediaUrl || ""),
              )
            : posts,
        );
        setTabError(null);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setProfilePosts([]);
          setTabError(
            getApiErrorMessage(
              requestError,
              "This profile section could not be loaded.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile, activeProfileTab]);

  const handleTabChange = (tab: "posts" | "shorties" | "saved") => {
    setPostsLoading(true);
    setTabError(null);
    setActiveTab(tab);
  };

  const handleToggleFollow = async () => {
    if (!profile || followLoading) return;

    try {
      setFollowLoading(true);
      setActionError(null);
      const res = await usersApi.toggleFollow(profile.id);

      setIsFollowing(res.following);
      setFollowersCount((prev) =>
        res.following ? prev + 1 : Math.max(0, prev - 1),
      );
    } catch (err: unknown) {
      setActionError(
        getApiErrorMessage(err, "Follow status could not be updated."),
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const tabs = [
    { id: "posts", label: "Posts", icon: Grid },
    { id: "shorties", label: "Shorties", icon: Clapperboard },
    { id: "saved", label: "Saved", icon: Bookmark },
  ] as const;

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-8 text-pure-gray-light dark:text-pure-gray-dark">
        <Loader2
          className="animate-spin text-black dark:text-white"
          size={24}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full min-h-screen p-8 text-center space-y-3">
        <h2 className="text-xl font-bold">Profile Unavailable</h2>
        <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
          {error || "User could not be found."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen border-r border-pure-border-light dark:border-pure-border-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-4 py-2.5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-black dark:text-white">
            @{profile.username}
          </h1>
          <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
            {profile._count?.posts ?? profilePosts.length} Posts
          </p>
        </div>
      </div>

      {/* Banner & Avatar */}
      <div className="h-32 sm:h-44 w-full bg-neutral-200 dark:bg-neutral-800 border-b border-pure-border-light dark:border-pure-border-dark relative">
        <div className="absolute -bottom-10 left-4 sm:left-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-2xl sm:text-3xl border-4 border-white dark:border-black uppercase overflow-hidden shadow-md">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.username.charAt(0)
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-4 sm:px-6 pt-3 pb-4 border-b border-pure-border-light dark:border-pure-border-dark">
        <div className="flex justify-end mb-3">
          {isOwnProfile ? (
            <motion.button
              type="button"
              onClick={() => setEditModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-1.5 text-xs font-bold rounded-full border border-pure-border-light dark:border-pure-border-dark hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors flex items-center gap-1.5"
            >
              <Edit3 size={14} />
              Edit Profile
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleToggleFollow}
              disabled={followLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
                isFollowing
                  ? "border border-pure-border-light dark:border-pure-border-dark hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
                  : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
              }`}
            >
              {followLoading
                ? "Updating..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </motion.button>
          )}
        </div>

        <h2 className="text-lg font-extrabold tracking-tight text-black dark:text-white">
          @{profile.username}
        </h2>

        {actionError && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {actionError}
          </p>
        )}

        {profile.bio && (
          <p className="mt-3 text-xs sm:text-sm text-black dark:text-white leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        <div className="flex items-center gap-1 mt-3 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          <Calendar size={13} />
          <span>
            Joined{" "}
            {profile.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "Recently"}
          </span>
        </div>

        <div className="flex items-center gap-5 mt-3 text-xs">
          <Link
            to={`/profile/${profile.username}/following`}
            className="flex items-center gap-1 hover:underline"
          >
            <span className="font-bold text-black dark:text-white">
              {followingCount}
            </span>
            <span className="text-pure-gray-light dark:text-pure-gray-dark">
              Following
            </span>
          </Link>

          <Link
            to={`/profile/${profile.username}/followers`}
            className="flex items-center gap-1 hover:underline"
          >
            <span className="font-bold text-black dark:text-white">
              {followersCount}
            </span>
            <span className="text-pure-gray-light dark:text-pure-gray-dark">
              Followers
            </span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pure-border-light dark:border-pure-border-dark">
        {tabs
          .filter((tab) => tab.id !== "saved" || isOwnProfile)
          .map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all relative flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "text-black dark:text-white"
                    : "text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
                  />
                )}
              </button>
            );
          })}
      </div>

      {postsLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading posts</span>
        </div>
      ) : tabError ? (
        <p role="alert" className="p-8 text-center text-sm text-red-600">
          {tabError}
        </p>
      ) : profilePosts.length === 0 ? (
        <div className="p-8 text-center text-xs sm:text-sm text-pure-gray-light dark:text-pure-gray-dark">
          No {activeProfileTab} found for @{profile.username}.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-px bg-pure-border-light dark:bg-pure-border-dark">
          {profilePosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPost(post)}
              aria-label={`Open post by @${profile.username}`}
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
                  <Heart size={12} className="mr-1 inline" />
                  {post._count.likes}
                </span>
                <span>
                  <MessageSquare size={12} className="mr-1 inline" />
                  {post._count.comments}
                </span>
              </span>
            </button>
          ))}
        </div>
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
                handleProfilePostDeleted(postId);
                setSelectedPost(null);
              }}
            />
          </div>
        </div>
      )}

      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        onUpdate={(updatedProfile) => {
          setProfile(updatedProfile);
          if (isOwnProfile) {
            updateUser(updatedProfile);
          }
        }}
      />
    </div>
  );
}
