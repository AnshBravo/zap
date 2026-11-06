import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { postsApi, type PaginationMeta } from "../api/posts";
import type { Post } from "../types";

export function usePostFeed(
  limit = 50,
  listenForCreatedPosts = false,
  loadErrorMessage = "Posts could not be loaded.",
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (page: number) => {
      const response = await postsApi.getFeed(page, limit);
      setPosts((current) =>
        page === 1 ? response.data.posts : [...current, ...response.data.posts],
      );
      setPagination(response.data.pagination);
    },
    [limit],
  );

  useEffect(() => {
    let cancelled = false;
    postsApi
      .getFeed(1, limit)
      .then((response) => {
        if (cancelled) return;
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(requestError, loadErrorMessage));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit, loadErrorMessage]);

  const retry = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadPage(1);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, loadErrorMessage));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!pagination?.hasNextPage || loadingMore) return;
    try {
      setLoadingMore(true);
      setError(null);
      await loadPage(pagination.page + 1);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "More posts could not be loaded."),
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const removePost = (postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  useEffect(() => {
    if (!listenForCreatedPosts) return;
    const handlePostCreated = (event: Event) => {
      const post = (event as CustomEvent<Post>).detail;
      if (post) setPosts((current) => [post, ...current]);
    };
    window.addEventListener("zap:post-created", handlePostCreated);
    return () =>
      window.removeEventListener("zap:post-created", handlePostCreated);
  }, [listenForCreatedPosts]);

  const updateCommentCount = (postId: string, count: number) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, _count: { ...post._count, comments: count } }
          : post,
      ),
    );
  };

  return {
    posts,
    pagination,
    loading,
    loadingMore,
    error,
    retry,
    loadMore,
    removePost,
    updateCommentCount,
  };
}
