import { useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { postsApi } from "../api/posts";
import type { Post } from "../types";

export function usePostLikes(post: Post) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likes, setLikes] = useState(post._count.likes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);
      const response = await postsApi.toggleLike(post.id);
      setLiked(response.liked);
      setLikes((count) => Math.max(0, count + (response.liked ? 1 : -1)));
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Like could not be updated."));
    } finally {
      setLoading(false);
    }
  };

  return { liked, likes, loading, error, toggleLike };
}
