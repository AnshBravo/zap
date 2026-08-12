import { Router } from "express";
import {
  createPost,
  getFeed,
  getPostById,
  deletePost,
} from "../controllers/post.controller.js";
import {
  toggleLike,
  addComment,
  getPostComments,
} from "../controllers/interaction.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Create & Feed
router.get("/", getFeed);
router.post("/", protect, createPost);

// Single Post Operations
router.get("/:id", getPostById);
router.delete("/:id", protect, deletePost);

//Likes/comment routes
router.post("/:postId/like", protect, toggleLike);
router.post("/:postId/comments", protect, addComment);
router.get("/:postId/comments", getPostComments);

export default router;
