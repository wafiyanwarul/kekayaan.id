import { PrismaClient } from "@prisma/client"

let _prisma: PrismaClient

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    const g = globalThis as unknown as { _prismaClient?: PrismaClient }
    _prisma = g._prismaClient ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    })
    if (process.env.NODE_ENV !== "production") g._prismaClient = _prisma
  }
  return _prisma
}

