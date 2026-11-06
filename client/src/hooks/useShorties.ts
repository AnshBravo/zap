import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { usersApi } from "../api/users";
import { usePostComments } from "./usePostComments";
import { usePostLikes } from "./usePostLikes";
import type { Post } from "../types";
import { isVideoMedia } from "../utils/media";
import { usePostFeed } from "./usePostFeed";

export function useShorties() {
  const feed = usePostFeed(50, false, "Shorties could not be loaded.");
  const posts = feed.posts.filter((post) => isVideoMedia(post.mediaUrl));
  const [activePost, setActivePost] = useState<Post | null>(null);
  const postComments = usePostComments(activePost?.id ?? null, 50);

  const openComments = (post: Post) => {
    setActivePost({ ...post });
  };

  return {
    posts,
    loading: feed.loading,
    error: feed.error,
    activePost,
    setActivePost,
    comments: postComments.comments,
    draft: postComments.draft,
    setDraft: postComments.setDraft,
    commentError: postComments.error,
    commentLoading: postComments.loading,
    openComments,
    addComment: postComments.addComment,
  };
}

export function useShortieReelActions(post: Post) {
  const postLikes = usePostLikes(post);
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    usersApi
      .getProfile(post.author.username)
      .then((response) => {
        if (active) setFollowing(response.data.user.isFollowing ?? false);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            getApiErrorMessage(
              requestError,
              "Follow status could not be loaded.",
            ),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [post.author.username]);

  const toggleFollow = async () => {
    if (pending) return;
    try {
      setPending(true);
      const response = await usersApi.toggleFollow(post.author.id);
      setFollowing(response.following);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Follow status could not be updated."),
      );
    } finally {
      setPending(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/shorties#${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${post.author.username}`,
          text: post.content,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      setError("Share was cancelled or unavailable.");
    }
  };

  return {
    liked: postLikes.liked,
    likes: postLikes.likes,
    likeLoading: postLikes.loading,
    following,
    pending,
    error: error ?? postLikes.error,
    toggleLike: postLikes.toggleLike,
    toggleFollow,
    share,
  };
}
