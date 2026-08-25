import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "./db/prisma.js";
import jwt from "jsonwebtoken";

let io: Server;

// Explicitly extending Socket fixes all the handshake, emit, and join errors
interface AuthenticatedSocket extends Socket {
  userId?: string;
  [key: string]: any; // Catch-all for any other custom properties
}

export const initSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Adding the explicit type to 'next' clears the implicit 'any' error
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const authSocket = socket as AuthenticatedSocket;
    const token =
      authSocket.handshake.auth?.token ||
      authSocket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret",
      ) as { userId: string };

      // Save the userId onto the socket object for later use
      authSocket.userId = decoded.userId;
      next(); // Call next to let the connection continue
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(
      `Socket connected: ${authSocket.id} (User: ${authSocket.userId})`,
    );

    if (authSocket.userId) {
      authSocket.join(`user:${authSocket.userId}`);
    }

    authSocket.on(
      "send_message",
      async (data: { receiverId: string; content: string }) => {
        try {
          const senderId = authSocket.userId;
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
          authSocket.emit("message_sent", message);
        } catch (err) {
          console.error("Error sending socket message:", err);
          authSocket.emit("error", { message: "Failed to deliver message." });
        }
      },
    );

    authSocket.on("disconnect", () => {
      console.log(`Socket disconnect: ${authSocket.id}`);
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
