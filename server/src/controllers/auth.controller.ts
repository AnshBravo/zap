import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { hashPassword, comparePasswords } from "../utils/password.js";
import { prisma } from "../db/prisma.js";
import { signToken } from "../utils/jwt.js";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// @route POST/api/v1/auth/register
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      throw ApiError.badRequest("Please provide username, email and password");
    }
    if (!EMAIL_REGEX.test(email)) {
      throw ApiError.badRequest("Please provide a valid email");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw ApiError.conflict("An account with this email already exists.");
      }
      throw ApiError.conflict("Username is already taken.");
    }

    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: newUser.id });

    res.status(201).json({
      status: "success",
      token,
      data: { user: newUser },
    });
  },
);

// @route POST /api/v1/auth/login
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      throw ApiError.badRequest("Please provide email and password.");
    }
    if (!EMAIL_REGEX.test(email)) {
      throw ApiError.badRequest("Please provide a valid email.");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await comparePasswords(password, user.passwordHash))) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = signToken({ userId: user.id });

    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      status: "success",
      token,
      data: { user: userWithoutPassword },
    });
  },
);

export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  },
);
