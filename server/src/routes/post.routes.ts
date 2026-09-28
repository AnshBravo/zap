import { Router } from "express";
import {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  getUploadUrl,
  searchPosts,
} from "../controllers/post.controller.js";
import {
  toggleLike,
  addComment,
  getPostComments,
  toggleBookmark,
  getBookmarkedPosts,
} from "../controllers/interaction.controller.js";
import { optionalAuth, protect } from "../middlewares/auth.middleware.js";

const router = Router();

// New: Route to get pre-signed URL
router.post("/upload-url", protect, getUploadUrl);

// Create & Feed
router.get("/bookmarks", protect, getBookmarkedPosts);
router.get("/search", optionalAuth, searchPosts);
router.get("/", optionalAuth, getFeed);
router.post("/", protect, createPost);

// Single Post Operations
router.get("/:id", optionalAuth, getPostById);
router.delete("/:id", protect, deletePost);

//Likes/comment routes
router.post("/:postId/like", protect, toggleLike);
router.post("/:postId/bookmark", protect, toggleBookmark);
router.post("/:postId/comments", protect, addComment);
router.get("/:postId/comments", getPostComments);

export default router;
