import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/prisma.js";

// @route GET /api/v1/users/:username
// description: Get public user profile by username
// access: Public

export const getPublicUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;

    if (!username || typeof username !== "string") {
      throw ApiError.badRequest("Username is Required.");
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound(`User '@${username}' not found.`);
    }
    res.status(200).json({
      status: "success",
      data: { user },
    });
  },
);

// @route PATCH /api/v1/users/me
// @desc UPDATE profile (bio, avatarUrl)
// @access Private (Authenticated)

export const updateProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { bio, avatarUrl } = req.body;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required.");
    }

    if (bio !== undefined && typeof bio !== "string") {
      throw ApiError.badRequest("Bio must be a string.");
    }
    if (avatarUrl !== undefined && typeof avatarUrl !== "string") {
      throw ApiError.badRequest("Avatar URL must be a string.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl.trim() }),
      },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  },
);
