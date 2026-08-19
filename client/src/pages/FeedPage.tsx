import React, { useState } from "react";
import PostComposer from "../components/feed/PostComposer";
import PostCard, { type ZapPost } from "../components/feed/PostCard";

export default function FeedPage() {
  const [posts, setPosts] = useState<ZapPost[]>([
    {
      id: "1",
      content: "Welcome to Zap! A minimalist black & white social experience.",
      author: {
        username: "zapteam",
        displayName: "Zap Team",
      },
      createdAt: "2h",
      likesCount: 12,
      repliesCount: 3,
      repostsCount: 1,
    },
  ]);

  const handlePostCreated = (newPost: ZapPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-6 py-3">
        <h1 className="text-lg font-black tracking-tight">Home</h1>
      </div>

      {/* Post Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Feed List */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
