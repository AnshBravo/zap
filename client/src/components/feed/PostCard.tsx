import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";
import type { AppLayoutContext } from "../layout/AppLayout";
import type { Comment, Post } from "../../types";
import { postsApi } from "../../api/posts";
import { getApiErrorMessage } from "../../api/errors";
import { useAuth } from "../../context/useAuth";

function MobileInlineComments({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange: (change: number) => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    postsApi
      .getComments(postId, 1, 20)
      .then((response) => {
        if (!cancelled) setComments(response.data.comments);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            getApiErrorMessage(requestError, "Comments could not be loaded."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await postsApi.addComment(postId, draft.trim());
      setComments((current) => [response.data.comment, ...current]);
      setDraft("");
      onCountChange(1);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Comment could not be posted."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await postsApi.deleteComment(commentId);
      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
      onCountChange(-1);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Comment could not be deleted."),
      );
    }
  };

  return (
    <section className="mt-3 border-t border-pure-border-light dark:border-pure-border-dark pt-3">
      {error && (
        <p role="alert" className="mb-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-xs text-pure-gray-light dark:text-pure-gray-dark">
          No comments yet.
        </p>
      ) : (
        <div className="max-h-56 space-y-3 overflow-y-auto py-1">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <p className="min-w-0">
                <Link
                  to={`/profile/${comment.user.username}`}
                  className="mr-1 font-bold"
                >
                  @{comment.user.username}
                </Link>
                {comment.content}
              </p>
              {comment.userId === user?.id && (
                <button
                  type="button"
                  onClick={() => void removeComment(comment.id)}
                  aria-label="Delete comment"
                  className="shrink-0 text-pure-gray-light hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submitComment} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder="Add a comment..."
          className="min-w-0 flex-1 border-b border-pure-border-light bg-transparent py-2 text-xs outline-none focus:border-black dark:border-pure-border-dark dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={!draft.trim() || submitting}
          aria-label="Post comment"
          className="p-2 disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </form>
    </section>
  );
}

export default function PostCard({
  post,
  onDelete,
  onCommentCountChange,
}: {
  post: Post;
  onDelete?: (postId: string) => void;
  onCommentCountChange?: (postId: string, count: number) => void;
}) {
  const { user } = useAuth();
  const context = useOutletContext<AppLayoutContext>();

  const selectedPost = context?.selectedPost;
  const handleToggleComments = context?.handleToggleComments;

  // Local interaction states
  const [showMobileComments, setShowMobileComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  // Counter states
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(
    post._count?.comments ?? 0,
  );

  const isSelectedInSidebar = selectedPost?.id === post.id;

  const onCommentClick = () => {
    if (window.innerWidth >= 1024) {
      handleToggleComments?.(post);
    } else {
      setShowMobileComments((prev) => !prev);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setInteractionError(null);
      const response = await postsApi.toggleLike(post.id);
      setIsLiked(response.liked);
      setLikesCount((current) =>
        Math.max(0, current + (response.liked ? 1 : -1)),
      );
    } catch (error: unknown) {
      setInteractionError(
        getApiErrorMessage(error, "Like could not be updated."),
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    try {
      setIsBookmarking(true);
      setInteractionError(null);
      const response = await postsApi.toggleBookmark(post.id);
      setIsBookmarked(response.bookmarked);
    } catch (error: unknown) {
      setInteractionError(
        getApiErrorMessage(error, "Saved post could not be updated."),
      );
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !window.confirm("Delete this post?")) return;
    try {
      setIsDeleting(true);
      setInteractionError(null);
      await postsApi.deletePost(post.id);
      onDelete?.(post.id);
    } catch (error: unknown) {
      setInteractionError(
        getApiErrorMessage(error, "Post could not be deleted."),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by @${post.author?.username || "user"}`,
          text: post.content,
          url: `${window.location.origin}/#post-${post.id}`,
        });
      } else {
        await navigator.clipboard.writeText(
          `${window.location.origin}/#post-${post.id}`,
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      setInteractionError(
        getApiErrorMessage(error, "Post could not be shared."),
      );
    }
  };

  const profilePath = post.author?.username
    ? `/profile/${post.author.username}`
    : "#";

  return (
    <article className="border-b border-pure-border-light dark:border-pure-border-dark p-4 hover:bg-pure-hover-light/30 dark:hover:bg-pure-hover-dark/30 transition-colors">
      <div className="flex gap-3">
        {/* User Avatar linked to profile */}
        <Link
          to={profilePath}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 border border-pure-border-light dark:border-pure-border-dark flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
        >
          {post.author?.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="w-full h-full object-cover"
            />
          ) : (
            post.author?.username?.charAt(0) || "U"
          )}
        </Link>

        {/* Content & Actions */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Profile Link */}
              <Link
                to={profilePath}
                className="font-bold text-sm truncate text-black dark:text-white hover:underline"
              >
                @{post.author?.username || "anonymous"}
              </Link>
              <time
                dateTime={post.createdAt}
                className="shrink-0 text-[11px] text-pure-gray-light dark:text-pure-gray-dark"
              >
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>

            {user?.id === post.authorId && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                aria-label="Delete post"
                title="Delete post"
                className="p-2 text-pure-gray-light hover:text-red-600 disabled:opacity-40"
              >
                {isDeleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            )}
          </div>

          {/* Post Content */}
          <p className="mt-1 text-sm text-black dark:text-white leading-relaxed whitespace-pre-line wrap-break-word">
            {post.content}
          </p>

          {/* Optional Media */}
          {post.mediaUrl && (
            <div className="mt-3 overflow-hidden border border-pure-border-light dark:border-pure-border-dark bg-black">
              {/\.(mp4|webm)(?:$|\?)/i.test(post.mediaUrl) ? (
                <video
                  src={post.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt="Post media attachment"
                  loading="lazy"
                  className="max-h-[70vh] w-full object-contain"
                />
              )}
            </div>
          )}

          {interactionError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {interactionError}
            </p>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 text-pure-gray-light dark:text-pure-gray-dark max-w-xs">
            {/* Like Button */}
            <button
              type="button"
              onClick={() => void handleLike()}
              disabled={isLiking}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-rose-500 group ${
                isLiked ? "text-rose-500" : ""
              }`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-rose-500/10">
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </div>
              <span>{likesCount}</span>
            </button>

            {/* Comment Button */}
            <button
              type="button"
              onClick={onCommentClick}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-sky-500 group ${
                isSelectedInSidebar || showMobileComments ? "text-sky-500" : ""
              }`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                <MessageSquare size={18} />
              </div>
              <span>{commentsCount}</span>
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={() => void handleBookmark()}
              disabled={isBookmarking}
              className={`flex items-center text-xs font-medium transition-colors hover:text-amber-500 group ${
                isBookmarked ? "text-amber-500" : ""
              }`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-amber-500/10">
                <Bookmark
                  size={18}
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </div>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center text-xs font-medium transition-colors hover:text-sky-500 group"
            >
              <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                <Share2 size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Inline Comments Drawer */}
      {showMobileComments && (
        <div className="block lg:hidden mt-3 pt-3 border-t border-pure-border-light dark:border-pure-border-dark pl-13">
          <MobileInlineComments
            postId={post.id}
            onCountChange={(change) => {
              const nextCount = Math.max(0, commentsCount + change);
              setCommentsCount(nextCount);
              onCommentCountChange?.(post.id, nextCount);
            }}
          />
        </div>
      )}
    </article>
  );
}
