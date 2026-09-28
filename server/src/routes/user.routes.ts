import { Router } from "express";
import {
  getPublicUser,
  getUserPosts,
  searchUsers,
  updateProfile,
} from "../controllers/user.controller.js";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";
import { optionalAuth, protect } from "../middlewares/auth.middleware.js";

const router = Router();

// reminder for me & others: It is standard practice to put fixed routes (/me) above dynamic routes(/:username)
router.patch("/me", protect, updateProfile);
router.get("/search", optionalAuth, searchUsers);

//Follow & Unfollow, List of followers and following
router.get("/:username/posts", optionalAuth, getUserPosts);
router.post("/:targetUserId", protect, toggleFollow);
router.get("/:targetUserId/followers", getFollowers);
router.get("/:targetUserId/following", getFollowing);

// Parameter routes
router.get("/:username", optionalAuth, getPublicUser);

export default router;
