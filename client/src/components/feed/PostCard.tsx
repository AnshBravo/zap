import React, { useState } from "react";
import {
  Heart,
  MessageSquare,
  Repeat2,
  Share,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

export interface ZapPost {
  id: string;
  content: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  isLiked?: boolean;
  isReposted?: boolean;
}

interface PostCardProps {
  post: ZapPost;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
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
                {post.author.displayName}
              </span>
              <span className="text-pure-gray-light dark:text-pure-gray-dark truncate font-medium">
                @{post.author.username}
              </span>
              <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium">
                ·
              </span>
              <span className="text-pure-gray-light dark:text-pure-gray-dark font-medium text-xs">
                {post.createdAt}
              </span>
            </div>
            <button className="text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Content */}
          <p className="mt-2 text-sm leading-relaxed text-black dark:text-white break-words">
            {post.content}
          </p>

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 text-pure-gray-light dark:text-pure-gray-dark max-w-md">
            {/* Reply */}
            <button className="flex items-center gap-1.5 text-xs font-medium hover:text-black dark:hover:text-white transition-colors">
              <MessageSquare size={16} />
              <span>{post.repliesCount}</span>
            </button>

            {/* Repost */}
            <button className="flex items-center gap-1.5 text-xs font-medium hover:text-black dark:hover:text-white transition-colors">
              <Repeat2 size={16} />
              <span>{post.repostsCount}</span>
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
