import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/prisma.js";
import { getIO } from "../socket.js";

//@route POST /api/v1/posts/:postId/like
//@desc Toggle like/unlike
//@access Private

export const toggleLike = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { postId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized("Authentication Required");
    }

    if (!postId || typeof postId !== "string") {
      throw ApiError.badRequest("Post ID is required");
    }

    // check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw ApiError.notFound("Post not found");
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      res.status(200).json({
        status: "success",
        message: "Post unLiked successfully",
        liked: false,
      });

      return;
    }

    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    if (post.authorId !== userId) {
      try {
        const io = getIO();
        io.to(`user:${post.authorId}`).emit("notification", {
          type: "LIKE",
          message: `Someone liked your post!`,
          postId,
          triggeredBy: userId,
        });
      } catch (err) {
        console.error("Socket emit failed:", err);
      }
    }

    res.status(201).json({
      status: "success",
      message: "Post liked successfully",
      liked: true,
    });
  },
);

//@route POST /api/v1/posts/:postId/comments
//@desc Add a comment to post
//@access Private

export const addComment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { postId } = req.params;
    const { content } = req.body;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required.");
    }

    if (!postId || typeof postId !== "string") {
      throw ApiError.badRequest("Post ID is required");
    }

    if (!content.trim() || typeof content !== "string") {
      throw ApiError.badRequest("Comment content cannot be empty");
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw ApiError.notFound("Post not found");
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (post.authorId !== userId) {
      try {
        const io = getIO();
        io.to(`user:${post.authorId}`).emit("notification", {
          type: "COMMENT",
          message: `@${comment.user.username} commented on your post!`,
          postId,
          commentId: comment.id,
          triggeredBy: {
            id: comment.user.id,
            username: comment.user.username,
            avatarUrl: comment.user.avatarUrl,
          },
        });
      } catch (err) {
        console.error("Socket emit failed:", err);
      }
    }
    res.status(201).json({
      status: "success",
      data: { comment },
    });
  },
);

//@route GET /api/v1/posts/:postId/comments
//@desc Get paginated comments for a post
//@access Public
export const getPostComments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { postId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    );
    const skip = (page - 1) * limit;

    if (!postId || typeof postId !== "string") {
      throw ApiError.badRequest("Post ID is required.");
    }

    const [comments, totalComments] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    const totalPages = Math.ceil(totalComments / limit);
    res.status(200).json({
      status: "success",
      data: {
        comments,
        pagination: {
          page,
          limit,
          totalComments,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
    });
  },
);

//@route DELETE /api/v1/comments/:commentId
//@desc Delete a comment (Author only)
//@access Private

export const deleteComment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { commentId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }
    if (!commentId || typeof commentId !== "string") {
      throw ApiError.badRequest("Comment ID is required.");
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      throw ApiError.notFound("Comment not found.");
    }

    if (comment.userId !== userId) {
      throw ApiError.forbidden("You can only delete your own comments.");
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  },
);
