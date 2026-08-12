import { Router } from "express";
import { deleteComment } from "../controllers/interaction.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.delete("/:commentId", protect, deleteComment);

export default router;
