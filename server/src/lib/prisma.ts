import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient instance reused across the app. Guarded against the
 * dev hot-reload creating multiple connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
