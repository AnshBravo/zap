import express, { Express, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app: Express = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Health Check Route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running healthy." });
});

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

export default app;
