import { Router } from "express";
import {
  getPublicUser,
  updateProfile,
} from "../controllers/user.controller.js";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// reminder for me & others: It is standard practice to put fixed routes (/me) above dynamic routes(/:username)
router.patch("/me", protect, updateProfile);

//Follow & Unfollow, List of followers and following
router.post("/:targetUserId", protect, toggleFollow);
router.get("/:targetUserId/followers", getFollowers);
router.get("/:targetUserId/following", getFollowing);

// Parameter routes
router.get("/:username", getPublicUser);

export default router;
