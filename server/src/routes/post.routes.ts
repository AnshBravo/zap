import { Router } from "express";
import {
  createPost,
  getFeed,
  getPostById,
  deletePost,
} from "../controllers/post.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Create & Feed
router.get("/", getFeed);
router.post("/", protect, createPost);

// Single Post Operations
router.get("/:id", getPostById);
router.delete("/:id", protect, deletePost);

export default router;
