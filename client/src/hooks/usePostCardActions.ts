import { useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { postsApi } from "../api/posts";
import type { Post } from "../types";

export function usePostCardActions(
  post: Post,
  onDelete?: (postId: string) => void,
) {
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const [bookmarking, setBookmarking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBookmark = async () => {
    if (bookmarking) return;
    try {
      setBookmarking(true);
      setError(null);
      const response = await postsApi.toggleBookmark(post.id);
      setBookmarked(response.bookmarked);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "Saved post could not be updated.",
        ),
      );
    } finally {
      setBookmarking(false);
    }
  };

  const deletePost = async () => {
    if (deleting || !window.confirm("Delete this post?")) return;
    try {
      setDeleting(true);
      setError(null);
      await postsApi.deletePost(post.id);
      onDelete?.(post.id);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Post could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by @${post.author?.username || "user"}`,
          text: post.content,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (requestError: unknown) {
      if (requestError instanceof Error && requestError.name === "AbortError") {
        return;
      }
      setError(getApiErrorMessage(requestError, "Post could not be shared."));
    }
  };

  return {
    bookmarked,
    bookmarking,
    deleting,
    error,
    toggleBookmark,
    deletePost,
    sharePost,
  };
}
