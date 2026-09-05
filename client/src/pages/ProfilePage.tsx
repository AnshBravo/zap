import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Calendar, Edit3, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { usersApi } from "../api/users";
import { postsApi } from "../api/posts";
import type { Post, User } from "../types";
import EditProfileModal from "../components/EditProfileModal";
import PostCard from "../components/feed/PostCard";

export default function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    "posts",
  );
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [editModelOpen, setEditModalOpen] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);

  const handleProfilePostDeleted = (postId: string) => {
    setProfilePosts((prev) => prev.filter((post) => post.id !== postId));
  };

  // Determine target username & ownership
  const targetUsername = username || currentUser?.username;
  const isOwnProfile = !username || username === currentUser?.username;

  // Fetch profile data on mount or when username parameter changes
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
          const targetUser = res.data.user;
          setProfile(targetUser);

          try {
            const [followersRes, followingRes, feedRes] = await Promise.all([
              usersApi.getFollowers(targetUser.id, 1, 1),
              usersApi.getFollowing(targetUser.id, 1, 1),
              postsApi.getFeed(1, 50),
            ]);

            setFollowersCount(
              followersRes.data.pagination.totalFollowers ??
                followersRes.data.followers?.length ??
                0,
            );
            setFollowingCount(
              followingRes.data.pagination.totalFollowing ??
                followingRes.data.following?.length ??
                followingRes.data.followers?.length ??
                0,
            );

            const authorPosts = (feedRes.data.posts || []).filter(
              (post) => post.author.id === targetUser.id,
            );
            setProfilePosts(authorPosts);
          } catch (countErr) {
            console.warn("Failed to load profile counts and posts:", countErr);
            setFollowersCount(0);
            setFollowingCount(0);
            setProfilePosts([]);
          }

          setIsFollowing(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to fetch user profile:", err);
          setError(err?.response?.data?.message || "User profile not found.");
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

  // Handle follow / unfollow toggle
  const handleToggleFollow = async () => {
    if (!profile || followLoading) return;

    try {
      setFollowLoading(true);
      const res = await usersApi.toggleFollow(profile.id);

      setIsFollowing(res.following);

      // Dynamically adjust follower count on toggle
      setFollowersCount((prev) =>
        res.following ? prev + 1 : Math.max(0, prev - 1),
      );
    } catch (err) {
      console.error("Failed to toggle follow status:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const tabs = [
    { id: "posts", label: "Posts" },
    { id: "replies", label: "Replies" },
    { id: "likes", label: "Likes" },
  ] as const;

  // Loading State UI
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

  // Error State UI
  if (error || !profile) {
    return (
      <div className="w-full min-h-screen p-8 text-center space-y-2">
        <h2 className="text-xl font-bold">Profile Unavailable</h2>
        <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
          {error || "Could not find profile details for this user."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black tracking-tight">
            @{profile.username}
          </h1>
          <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
            {profile._count?.posts || 0} Zaps
          </p>
        </div>
      </div>

      {/* Cover Header Banner */}
      <div className="h-32 sm:h-48 w-full bg-pure-hover-light dark:bg-pure-hover-dark border-b border-pure-border-light dark:border-pure-border-dark relative">
        {/* Profile Avatar Overlay */}
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-2xl sm:text-3xl border-4 border-white dark:border-black uppercase shadow-sm">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.username.charAt(0)
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Bar */}
      <div className="px-6 pt-3 pb-6 border-b border-pure-border-light dark:border-pure-border-dark">
        {/* Action Button (Edit Profile / Follow) */}
        <div className="flex justify-end mb-4">
          {isOwnProfile ? (
            <motion.button
              onClick={() => setEditModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-pure-border-light dark:border-pure-border-dark hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors flex items-center gap-2"
            >
              <Edit3 size={15} />
              Edit Profile
            </motion.button>
          ) : (
            <motion.button
              onClick={handleToggleFollow}
              disabled={followLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
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

        {/* Name & Handle */}
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight">
            @{profile.username}
          </h2>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-3 text-sm font-normal leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-pure-gray-light dark:text-pure-gray-dark">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
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
        </div>

        {/* Followers / Following Counts */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <Link
            to={
              profile.username === currentUser?.username
                ? "/profile/following"
                : `/profile/${profile.username}/following`
            }
            className="flex items-center gap-1.5 hover:underline"
          >
            <span className="font-extrabold">{followingCount}</span>
            <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium">
              Following
            </span>
          </Link>
          <Link
            to={
              profile.username === currentUser?.username
                ? "/profile/followers"
                : `/profile/${profile.username}/followers`
            }
            className="flex items-center gap-1.5 hover:underline"
          >
            <span className="font-extrabold">{followersCount}</span>
            <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium">
              Followers
            </span>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-pure-border-light dark:border-pure-border-dark">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? "text-black dark:text-white"
                : "text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="profileTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed Content Placeholder */}
      {profilePosts.length === 0 ? (
        <div className="p-6 text-center text-sm text-pure-gray-light dark:text-pure-gray-dark font-medium">
          No {activeTab} yet.
        </div>
      ) : (
        <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {profilePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleProfilePostDeleted}
            />
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModelOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        onUpdate={(updatedProfile) => {
          setProfile(updatedProfile);
          updateUser(updatedProfile);
        }}
      />
    </div>
  );
}
