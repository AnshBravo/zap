import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "./db/prisma.js";
import jwt from "jsonwebtoken";
import { userInfo } from "os";

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret",
      ) as { userId: string };
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join a private room dedicated to this user's ID for targeted notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on(
      "send_message",
      async (data: { receiverId: string; content: string }) => {
        try {
          const senderId = socket.userId;
          const { receiverId, content } = data;

          if (!senderId || !receiverId || !content?.trim()) return;

          const message = await prisma.message.create({
            data: {
              senderId,
              receiverId,
              content: content.trim(),
            },
            include: {
              sender: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
          });

          io.to(`user:${receiverId}`).emit("receive_message", message);

          socket.emit("message_sent", message);
        } catch (err) {
          console.error("Error sending socket message:", err);
          socket.emit("error", { message: "Failed to deliver message." });
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnect: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
