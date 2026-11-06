import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { postsApi } from "../api/posts";
import type { Comment } from "../types";

export function usePostComments(postId: string | null, limit = 20) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadedPostId, setLoadedPostId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;
    postsApi
      .getComments(postId, 1, limit)
      .then((response) => {
        if (!cancelled) {
          setComments(response.data.comments);
          setLoadedPostId(postId);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setLoadedPostId(postId);
          setError(
            getApiErrorMessage(requestError, "Comments could not be loaded."),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [limit, postId]);

  const currentComments = loadedPostId === postId ? comments : [];
  const currentError = loadedPostId === postId ? error : null;
  const loading = Boolean(postId) && loadedPostId !== postId;

  const addComment = async () => {
    if (!postId || !draft.trim() || submitting) return null;

    try {
      setSubmitting(true);
      setError(null);
      const response = await postsApi.addComment(postId, draft.trim());
      setComments((current) => [response.data.comment, ...current]);
      setDraft("");
      return response.data.comment;
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Comment could not be posted."),
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await postsApi.deleteComment(commentId);
      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
      setError(null);
      return true;
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Comment could not be deleted."),
      );
      return false;
    }
  };

  return {
    comments: currentComments,
    draft,
    setDraft,
    loading,
    submitting,
    error: currentError,
    addComment,
    deleteComment,
  };
}
