import { useState } from "react";
import {
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { postsApi } from "../../api/posts";
import { useAuth } from "../../context/AuthContext";

export interface ZapPost {
  id: string;
  content: string;
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
  const [isDeleting, setIsDeleting] = useState(false);

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

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 text-pure-gray-light dark:text-pure-gray-dark max-w-md">
            {/* Reply */}
            <button className="flex items-center gap-1.5 text-xs font-medium hover:text-black dark:hover:text-white transition-colors">
              <MessageSquare size={16} />
              <span>{post._count?.comments || 0}</span>
            </button>

            {/* Like */}
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

            {/* Share */}
            <button className="flex items-center gap-1.5 text-xs font-medium hover:text-black dark:hover:text-white transition-colors">
              <Share size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
