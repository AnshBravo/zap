import React, { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import { SocketContext } from "./SocketContextBase";

interface SocketProviderProps {
  children: React.ReactNode;
}

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export function SocketProvider({ children }: SocketProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Establish connection only when the user is authenticated

    if (!isAuthenticated || !token) return;

    const socketInstance = io(SOCKET_SERVER_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      setSocket(socketInstance);
      setIsConnected(true);
    });
    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    //cleanup on unmount or token change
    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
