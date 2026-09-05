import { useEffect, useState } from "react";
import {
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";
import { postsApi } from "../../api/posts";
import { useAuth } from "../../context/AuthContext";
import type { Comment } from "../../types";

export interface ZapPost {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaKey?: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
  isReposted?: boolean;
}

interface PostCardProps {
  post: ZapPost;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [commentsCount, setCommentsCount] = useState(
    post._count?.comments || 0,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!commentsOpen) return;

    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await postsApi.getComments(post.id, 1, 10);
        setComments(response.data.comments || []);
      } catch (error) {
        console.error("Failed to load comments:", error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [commentsOpen, post.id]);

  const handleLike = async () => {
    try {
      const response = await postsApi.toggleLike(post.id);
      setIsLiked(response.liked);
      setLikesCount((prev) =>
        response.liked ? prev + 1 : Math.max(0, prev - 1),
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !user || user.id !== post.authorId) return;

    try {
      setIsDeleting(true);
      await postsApi.deletePost(post.id);
      onDelete(post.id);
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentDraft.trim() || commentSubmitting) return;

    try {
      setCommentSubmitting(true);
      setCommentError(null);

      const response = await postsApi.addComment(post.id, {
        content: commentDraft.trim(),
      });

      const createdComment = response.data.comment;
      setComments((prev) => [createdComment, ...prev]);
      setCommentsCount((prev) => prev + 1);
      setCommentDraft("");
    } catch (error: any) {
      console.error("Failed to add comment:", error);
      setCommentError(
        error?.response?.data?.message ||
          "Unable to add your comment right now.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await postsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleShare = async () => {
    const shareText = `@${post.author.username}: ${post.content}`;
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Zap by @${post.author.username}`,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("Post shared");
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareStatus("Link copied");
    } catch (error) {
      console.error("Failed to share post:", error);
      setShareStatus("Share unavailable");
    }

    window.setTimeout(() => setShareStatus(null), 1800);
  };

  return (
    <div className="p-4 border-b border-pure-border-light dark:border-pure-border-dark hover:bg-pure-hover-light/40 dark:hover:bg-pure-hover-dark/40 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-base shrink-0 uppercase">
          {post.author.username.charAt(0)}
        </div>

        {/* Post Main Body */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden text-sm">
              <span className="font-extrabold truncate text-black dark:text-white">
                @{post.author.username}
              </span>
              <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium">
                ·
              </span>
              <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium text-xs">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user?.id === post.authorId && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-pure-gray-light dark:text-pure-gray-dark hover:text-red-500 transition-colors disabled:opacity-50"
                  aria-label="Delete post"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button className="text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <p className="mt-2 text-sm leading-relaxed text-black dark:text-white wrap-break-word">
            {post.content}
          </p>

          {post.mediaUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-pure-border-light dark:border-pure-border-dark">
              {post.mediaKey?.match(/\.(mp4|webm)$/i) ? (
                <video
                  src={post.mediaUrl}
                  controls
                  className="max-h-96 w-full"
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt="Post media"
                  className="max-h-96 w-full object-cover"
                />
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 text-pure-gray-light dark:text-pure-gray-dark max-w-md">
            <button
              onClick={() => setCommentsOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-black dark:hover:text-white transition-colors"
            >
              <MessageSquare size={16} />
              <span>{commentsCount}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isLiked
                  ? "text-rose-500"
                  : "hover:text-black dark:hover:text-white"
              }`}
            >
              <motion.div whileTap={{ scale: 1.3 }}>
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              </motion.div>
              <span>{likesCount}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-black dark:hover:text-white transition-colors"
              aria-label="Share post"
            >
              <Share size={16} />
              {shareStatus ? (
                <span className="text-[10px] text-emerald-500">
                  {shareStatus}
                </span>
              ) : null}
            </button>
          </div>

          {commentsOpen && (
            <div className="mt-4 border-t border-pure-border-light dark:border-pure-border-dark pt-3 space-y-3">
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a comment..."
                  maxLength={200}
                  className="flex-1 rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-pure-hover-light dark:bg-pure-hover-dark px-3 py-2 text-xs text-black dark:text-white placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentDraft.trim() || commentSubmitting}
                  className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {commentSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>

              {commentError && (
                <div className="text-xs text-red-500">{commentError}</div>
              )}

              {commentsLoading ? (
                <div className="flex items-center justify-center py-2 text-xs text-pure-gray-light dark:text-pure-gray-dark">
                  <Loader2 className="mr-2 animate-spin" size={14} />
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-pure-border-light dark:border-pure-border-dark bg-pure-hover-light/40 px-3 py-2 dark:bg-pure-hover-dark/40"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-pure-gray-light dark:text-pure-gray-dark">
                        <span className="font-bold text-black dark:text-white">
                          @{comment.user.username}
                        </span>
                        {comment.userId === user?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 transition-opacity hover:opacity-80"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-black dark:text-white">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
