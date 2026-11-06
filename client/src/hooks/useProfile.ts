import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { postsApi } from "../api/posts";
import { usersApi } from "../api/users";
import type { Post, User } from "../types";
import { isVideoMedia } from "../utils/media";

export type ProfileTab = "posts" | "shorties" | "saved";

export function useProfile(
  targetUsername: string | undefined,
  isOwnProfile: boolean,
) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [profileState, setProfile] = useState<User | null>(null);
  const [loadedUsername, setLoadedUsername] = useState<string | undefined>();
  const [loadedPostsKey, setLoadedPostsKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [tabError, setTabError] = useState<string | null>(null);

  const activeProfileTab =
    !isOwnProfile && activeTab === "saved" ? "posts" : activeTab;
  const profile =
    loadedUsername === targetUsername ? profileState : null;
  const profileUsername = profile?.username;
  const postsKey = profileUsername
    ? `${profileUsername}:${activeProfileTab}`
    : null;

  useEffect(() => {
    if (!targetUsername) return;

    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const response = await usersApi.getProfile(targetUsername);
        if (cancelled) return;
        const user = response.data.user;
        setProfile(user);
        setError(null);
        setFollowersCount(user._count?.followers ?? 0);
        setFollowingCount(user._count?.following ?? 0);
        setIsFollowing(user.isFollowing ?? false);
      } catch (requestError: unknown) {
        if (!cancelled) {
          setProfile(null);
          setError(getApiErrorMessage(requestError, "User profile not found."));
        }
      } finally {
        if (!cancelled) setLoadedUsername(targetUsername);
      }
    };

    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [targetUsername]);

  useEffect(() => {
    if (!profileUsername || !postsKey) return;

    let cancelled = false;
    const fetchProfilePosts = async () => {
      try {
        const response =
          activeProfileTab === "saved"
            ? await postsApi.getBookmarks(1, 50)
            : await usersApi.getUserPosts(profileUsername, 1, 50);
        if (cancelled) return;
        const posts = response.data.posts;
        setProfilePosts(
          activeProfileTab === "shorties"
            ? posts.filter((post) =>
                isVideoMedia(post.mediaUrl),
              )
            : posts,
        );
        setTabError(null);
      } catch (requestError: unknown) {
        if (!cancelled) {
          setProfilePosts([]);
          setTabError(
            getApiErrorMessage(
              requestError,
              "This profile section could not be loaded.",
            ),
          );
        }
      } finally {
        if (!cancelled) setLoadedPostsKey(postsKey);
      }
    };

    void fetchProfilePosts();
    return () => {
      cancelled = true;
    };
  }, [activeProfileTab, postsKey, profileUsername]);

  const changeTab = (tab: ProfileTab) => {
    setTabError(null);
    setActiveTab(tab);
  };

  const toggleFollow = async () => {
    if (!profile || followLoading) return;
    try {
      setFollowLoading(true);
      setActionError(null);
      const response = await usersApi.toggleFollow(profile.id);
      setIsFollowing(response.following);
      setFollowersCount((count) =>
        response.following ? count + 1 : Math.max(0, count - 1),
      );
    } catch (requestError: unknown) {
      setActionError(
        getApiErrorMessage(
          requestError,
          "Follow status could not be updated.",
        ),
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const removeProfilePost = (postId: string) => {
    setProfilePosts((posts) => posts.filter((post) => post.id !== postId));
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

  return {
    activeTab,
    activeProfileTab,
    changeTab,
    profile,
    setProfile,
    loading: Boolean(targetUsername) && loadedUsername !== targetUsername,
    postsLoading: Boolean(postsKey) && loadedPostsKey !== postsKey,
    error,
    isFollowing,
    followLoading,
    actionError,
    followersCount,
    followingCount,
    profilePosts,
    tabError,
    toggleFollow,
    removeProfilePost,
  };
}
