import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/prisma.js";

//@route GET /api/v1/messages/:otherUserId
//@desc Get chat history between current user and another user
//@access Private

export const getChatHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const currentUserId = req.user?.id;
    const { otherUserId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }
    if (!otherUserId || typeof otherUserId !== "string") {
      throw ApiError.badRequest("Other user ID is required.");
    }

    const [message, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId },
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(totalMessages / limit);

    res.status(200).json({
      status: "success",
      data: {
        messages: totalMessages.reverse(),
        pagination: {
          page,
          limit,
          totalMessages,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
    });
  },
);
