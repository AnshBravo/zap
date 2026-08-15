import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getChatHistory } from "../controllers/message.controller.js";

const router = Router();

router.get("/:otherUserId", protect, getChatHistory);

export default router;
