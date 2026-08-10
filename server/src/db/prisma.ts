// Ensure single instance of Prisma Client across hot-reloads
import { PrismaClient, Prisma } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Initialize the PostgreSQL adapter with your connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// 2. Configure log levels
const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"];

// 3. Instantiate PrismaClient passing the adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
