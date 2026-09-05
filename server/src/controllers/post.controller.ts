import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/prisma.js";
import {
  allowedMediaTypes,
  generatePresignedUploadUrl,
  deleteFileFromS3,
  getMediaUrl,
} from "../utils/s3.js";

// New Handler for getting Pre-signed Upload URL
export const getUploadUrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (
      typeof fileType !== "string" ||
      !allowedMediaTypes.has(fileType.toLowerCase())
    ) {
      return res
        .status(400)
        .json({ status: "fail", message: "Unsupported media type." });
    }

    const uploadData = await generatePresignedUploadUrl(
      userId,
      fileType.toLowerCase(),
    );

    return res.status(200).json({
      status: "success",
      data: uploadData,
    });
  },
);

//@route POST /api/v1/posts
//@desc  Create a new post
//@access Private
// new Update: createPost now also handles image and video media via media key and media url

export const createPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { content, mediaUrl, mediaKey } = req.body;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required.");
    }
    if (typeof content !== "string" || !content.trim()) {
      throw ApiError.badRequest("Post content cannot be empty");
    }
    if (content.length > 200) {
      throw ApiError.badRequest("Post content cannot exceed 200 characters.");
    }

    if ((mediaUrl && !mediaKey) || (!mediaUrl && mediaKey)) {
      throw ApiError.badRequest(
        "mediaUrl and mediaKey must be provided together",
      );
    }

    if (
      mediaKey &&
      (typeof mediaKey !== "string" ||
        !mediaKey.startsWith(`uploads/${userId}/`) ||
        typeof mediaUrl !== "string" ||
        mediaUrl !== getMediaUrl(mediaKey))
    ) {
      throw ApiError.badRequest("Invalid media metadata");
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        mediaUrl: mediaUrl || null,
        mediaKey: mediaKey || null,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: { post },
    });
  },
);

//@route GET /api/v1/posts
//@desc Get paginated posts feed
//@access Public

export const getFeed = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    );
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.post.count(),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      status: "success",
      data: {
        posts,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
    });
  },
);

// @route GET /api/v1/posts/:id
// @desc Get post by ID
// @access Public

export const getPostById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      throw ApiError.badRequest("Post ID is required.");
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw ApiError.notFound("Post not found");
    }

    res.status(200).json({
      status: "success",
      data: { post },
    });
  },
);

// @route DELETE /api/v1/posts/:id
// @desc Delete a post by ID (Author only)
// @access Private

export const deletePost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const id = req.params.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (!id || typeof id != "string") {
      throw ApiError.badRequest("Post ID is required");
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        authorId: true,
        mediaKey: true,
      },
    });

    if (!post) {
      throw ApiError.notFound("Post not found.");
    }

    if (post.authorId !== userId) {
      throw ApiError.forbidden("You don't have authorization to delete Post");
    }

    // Delete associated file from S3 is it exists
    if (post.mediaKey) {
      await deleteFileFromS3(post.mediaKey);
    }
    await prisma.post.delete({ where: { id } });

    res.status(200).json({
      status: "success",
      message: "Post deleted successfully",
    });
  },
);
