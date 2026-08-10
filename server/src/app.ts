import express, { Express, Request, Response } from "express";
import cors from "cors";

const app: Express = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Health Check Route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running healthy." });
});

export default app;
