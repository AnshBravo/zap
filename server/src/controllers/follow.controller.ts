import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/prisma.js";
import { getIO } from "../socket.js";

//@route POST /api/v1/users/:targetUserId/follow
//@desc Toggle follow / unfollow a user
//@access Private

export const toggleFollow = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const currentUserId = req.user?.id;
    const { targetUserId } = req.params;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }
    if (!targetUserId || typeof targetUserId !== "string") {
      throw ApiError.badRequest("Target user ID is required");
    }

    if (currentUserId === targetUserId) {
      // prevent self following(yup people do that!)
      throw ApiError.badRequest("You cannot follow yourself.");
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw ApiError.notFound("Target user not found");
    }

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    // Unfollow if followed
    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      res.status(200).json({
        status: "success",
        message: "Unfollowed successfully",
        following: false,
      });
      return;
    }

    // Follow
    await prisma.follows.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    try {
      const io = getIO();
      io.to(`user: ${targetUserId}`).emit("notification", {
        type: "FOLLOW",
        message: `A user started following you`,
        followerId: currentUserId,
      });
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    res.status(201).json({
      status: "success",
      message: "Followed successfully.",
      following: true,
    });
  },
);

//@route GET /api/v1/users/:targetUserId/followers
//@desc  Get paginated followers list
//@access Public

export const getFollowers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { targetUserId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    );
    const skip = (page - 1) * limit;

    if (!targetUserId || typeof targetUserId !== "string") {
      throw ApiError.badRequest(" User ID is required");
    }

    const [followers, totalFollowers] = await Promise.all([
      prisma.follows.findMany({
        where: { followingId: targetUserId },
        skip,
        take: limit,
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      prisma.follows.count({ where: { followingId: targetUserId } }),
    ]);

    const totalPages = Math.ceil(totalFollowers / limit);

    res.status(200).json({
      status: "success",
      data: {
        followers: followers.map((f) => f.follower),
        pagination: {
          page,
          limit,
          totalFollowers,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
    });
  },
);

// @route GET /api/v1/users/:targetUserid/following
// @desc  Get paginated following list
// @access Public

export const getFollowing = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { targetUserId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    );
    const skip = (page - 1) * limit;

    if (!targetUserId || typeof targetUserId !== "string") {
      throw ApiError.badRequest(" User ID is required");
    }

    const [following, totalFollowing] = await Promise.all([
      prisma.follows.findMany({
        where: { followerId: targetUserId },
        skip,
        take: limit,
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      prisma.follows.count({ where: { followerId: targetUserId } }),
    ]);

    const totalPages = Math.ceil(totalFollowing / limit);

    res.status(200).json({
      status: "success",
      data: {
        followers: following.map((f) => f.follower),
        pagination: {
          page,
          limit,
          totalFollowing,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
    });
  },
);
