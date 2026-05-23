// Prisma client singleton - server-side only
// Will be properly initialized once `prisma generate` runs with DATABASE_URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _prisma: any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrisma(): any {
  if (!_prisma) {
    // Dynamic require to avoid build-time errors before prisma generate
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client")
    const g = globalThis as { _prismaClient?: typeof _prisma }
    _prisma = g._prismaClient ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error"] : [] })
    if (process.env.NODE_ENV !== "production") g._prismaClient = _prisma
  }
  return _prisma
}
