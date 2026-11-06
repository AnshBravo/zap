import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { usePostComments } from "./usePostComments";
import { usePostFeed } from "./usePostFeed";
import { useAuth } from "../context/useAuth";
import { usersApi } from "../api/users";
import type { Post } from "../types";

export function useRightWidget(selectedPost: Post | null) {
  const { user } = useAuth();
  const { posts, error: feedError } = usePostFeed(
    20,
    false,
    "Sidebar suggestions could not be loaded.",
  );
  const postComments = usePostComments(selectedPost?.id ?? null);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const unique = new Map<string, Post["author"]>();
    for (const post of posts) {
      if (post.author.id !== user?.id) unique.set(post.author.id, post.author);
    }
    return [...unique.values()].slice(0, 4);
  }, [posts, user?.id]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      suggestions.map(async (suggestion) => {
        const response = await usersApi.getProfile(suggestion.username);
        return response.data.user;
      }),
    )
      .then((profiles) => {
        if (!cancelled) {
          setSuggestionError(null);
          setFollowState(
            Object.fromEntries(
              profiles.map((profile) => [
                profile.id,
                profile.isFollowing ?? false,
              ]),
            ),
          );
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setSuggestionError(
            getApiErrorMessage(
              requestError,
              "Suggested accounts could not be loaded.",
            ),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [suggestions]);

  const toggleFollow = async (userId: string) => {
    try {
      setSuggestionError(null);
      const response = await usersApi.toggleFollow(userId);
      setFollowState((current) => ({
        ...current,
        [userId]: response.following,
      }));
    } catch (requestError: unknown) {
      setSuggestionError(
        getApiErrorMessage(
          requestError,
          "Follow status could not be updated.",
        ),
      );
    }
  };

  return {
    user,
    feedError,
    suggestions,
    followState,
    suggestionError,
    toggleFollow,
    comments: postComments.comments,
    commentDraft: postComments.draft,
    setCommentDraft: postComments.setDraft,
    isLoadingComments: postComments.loading,
    isSubmitting: postComments.submitting,
    commentError: postComments.error,
    addComment: postComments.addComment,
    deleteComment: postComments.deleteComment,
  };
}
