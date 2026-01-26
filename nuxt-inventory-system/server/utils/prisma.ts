import { PrismaClient } from '@prisma/client'
import { getDbConfig } from '~/server/utils/dbConfig'

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const { host, port, user, password, database } = getDbConfig()

  if (!host || !database || !user) {
    throw new Error('Database configuration is incomplete. Check DB_* env vars.')
  }

  const encodedUser = encodeURIComponent(user)
  const encodedPassword = password ? encodeURIComponent(password) : ''
  const credentials = encodedPassword ? `${encodedUser}:${encodedPassword}` : encodedUser

  return `postgresql://${credentials}@${host}:${port}/${database}`
}

const globalForPrisma = globalThis as { prisma?: PrismaClient }

export const getPrismaClient = () => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: buildDatabaseUrl() }
    }
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
