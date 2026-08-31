import { PrismaClient } from "@prisma/client";

type PrismaGlobal = {
  prisma?: PrismaClient;
  databaseUrl?: string;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const databaseUrl = process.env.DATABASE_URL ?? "";

if (
  !globalForPrisma.prisma ||
  (databaseUrl && globalForPrisma.databaseUrl !== databaseUrl)
) {
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.databaseUrl = databaseUrl;
}

export const prisma = globalForPrisma.prisma;
