import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Post } from "../types";

export function useAppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const toggleComments = (post: Post) => {
    setSelectedPost((current) => (current?.id === post.id ? null : post));
  };

  const handlePostCreated = (post: Post) => {
    setCreateOpen(false);
    window.dispatchEvent(new CustomEvent("zap:post-created", { detail: post }));
    navigate("/");
  };

  return {
    isShortiesRoute: pathname === "/shorties",
    selectedPost,
    setSelectedPost,
    createOpen,
    setCreateOpen,
    toggleComments,
    handlePostCreated,
  };
}
