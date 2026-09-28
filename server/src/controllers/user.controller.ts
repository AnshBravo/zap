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
          select: { posts: true, followedBy: true, following: true },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound(`User '@${username}' not found.`);
    }
    const followRelationship = req.user?.id
      ? await prisma.follows.findUnique({
          where: {
            followerId_followingId: {
              followerId: req.user.id,
              followingId: user.id,
            },
          },
          select: { followerId: true },
        })
      : null;

    const { _count, ...publicUser } = user;

    res.status(200).json({
      status: "success",
      data: {
        user: {
          ...publicUser,
          isFollowing: Boolean(followRelationship),
          _count: {
            posts: _count.posts,
            followers: _count.followedBy,
            following: _count.following,
          },
        },
      },
    });
  },
);

export const searchUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) throw ApiError.badRequest("Search query is required.");

    const users = await prisma.user.findMany({
      where: { username: { contains: query.replace(/^@/, ""), mode: "insensitive" } },
      take: 20,
      orderBy: { username: "asc" },
      select: { id: true, username: true, avatarUrl: true, bio: true },
    });

    const following = req.user?.id
      ? await prisma.follows.findMany({
          where: {
            followerId: req.user.id,
            followingId: { in: users.map((user) => user.id) },
          },
          select: { followingId: true },
        })
      : [];
    const followingIds = new Set(following.map((relation) => relation.followingId));

    res.status(200).json({
      status: "success",
      data: {
        users: users.map((user) => ({
          ...user,
          isFollowing: followingIds.has(user.id),
        })),
      },
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

export const getUserPosts = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;
    if (!username || typeof username !== "string") {
      throw ApiError.badRequest("Username is required.");
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) throw ApiError.notFound(`User '@${username}' not found.`);

    const where = { authorId: user.id };
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
          ...(req.user?.id && {
            likes: { where: { userId: req.user.id }, select: { id: true }, take: 1 },
            bookmarks: { where: { userId: req.user.id }, select: { userId: true }, take: 1 },
          }),
        },
      }),
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);
    res.status(200).json({
      status: "success",
      data: {
        posts: posts.map((post) => ({
          ...post,
          isLiked: Boolean("likes" in post && post.likes.length),
          isBookmarked: Boolean("bookmarks" in post && post.bookmarks.length),
          likes: undefined,
          bookmarks: undefined,
        })),
        pagination: { page, limit, totalPosts, totalPages, hasNextPage: page < totalPages },
      },
    });
  },
);
