import { useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { postsApi } from "../api/posts";
import { usersApi } from "../api/users";
import type { Post, User } from "../types";

export function useSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const search = async (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    try {
      setLoading(true);
      setError(null);
      const [userResponse, postResponse] = await Promise.all([
        usersApi.searchUsers(cleanQuery),
        postsApi.searchPosts(cleanQuery),
      ]);
      const foundUsers = userResponse.data.users;
      setUsers(foundUsers);
      setPosts(postResponse.data.posts);
      setFollowingIds(
        new Set(
          foundUsers.filter((user) => user.isFollowing).map((user) => user.id),
        ),
      );
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Search is unavailable right now."),
      );
      setUsers([]);
      setPosts([]);
      setFollowingIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId: string) => {
    if (pendingId) return;
    try {
      setPendingId(userId);
      setError(null);
      const response = await usersApi.toggleFollow(userId);
      setFollowingIds((current) => {
        const next = new Set(current);
        if (response.following) next.add(userId);
        else next.delete(userId);
        return next;
      });
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Follow status could not be updated."),
      );
    } finally {
      setPendingId(null);
    }
  };

  const removePost = (postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  return {
    users,
    posts,
    loading,
    error,
    followingIds,
    pendingId,
    search,
    toggleFollow,
    removePost,
  };
}
