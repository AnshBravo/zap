import { Router } from "express";
import {
  getPublicUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// reminder for me & others: It is standard practice to put fixed routes (/me) above dynamic routes(/:username)
router.patch("/me", protect, updateProfile);
router.get("/:username", getPublicUser);

export default router;
