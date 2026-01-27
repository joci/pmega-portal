import { createHash, randomBytes } from 'node:crypto'
import { getCookie, setCookie, deleteCookie } from 'h3'
import type { H3Event } from 'h3'
import { getPrismaClient } from '~/server/utils/prisma'

export type AuthUser = {
  user_id: string
  email: string
  username: string
  name: string | null
  role: string
}

const getCookieName = () => {
  const config = useRuntimeConfig()
  return config.authCookieName || 'omega_session'
}

const getSessionDays = () => {
  const config = useRuntimeConfig()
  const value = Number(config.authSessionDays || 7)
  return Number.isNaN(value) || value <= 0 ? 7 : value
}

const getSecureCookie = () => {
  const config = useRuntimeConfig()
  return config.appEnv === 'prod'
}

const hashToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex')
}

export const createSession = async (event: H3Event, userId: string) => {
  const prisma = getPrismaClient()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + getSessionDays() * 24 * 60 * 60 * 1000)
  const userAgent = event.node.req.headers['user-agent'] || null
  const ipAddress =
    (event.node.req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    event.node.req.socket?.remoteAddress ||
    null

  await prisma.session.create({
    data: {
      session_id: randomBytes(16).toString('hex'),
      user_id: userId,
      token_hash: tokenHash,
      created_at: now,
      expires_at: expiresAt,
      last_seen_at: now,
      ip_address: ipAddress,
      user_agent: userAgent
    }
  })

  setCookie(event, getCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getSecureCookie(),
    path: '/',
    expires: expiresAt
  })
}

export const clearSession = async (event: H3Event) => {
  const prisma = getPrismaClient()
  const token = getCookie(event, getCookieName())
  if (token) {
    const tokenHash = hashToken(token)
    await prisma.session.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() }
    })
  }
  deleteCookie(event, getCookieName(), { path: '/' })
}

export const getAuthUser = async (event: H3Event) => {
  if (event.context.authUser) {
    return event.context.authUser as AuthUser
  }
  const token = getCookie(event, getCookieName())
  if (!token) {
    return null
  }
  const prisma = getPrismaClient()
  const tokenHash = hashToken(token)
  const session = await prisma.session.findFirst({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: { gt: new Date() }
    },
    include: { user: true }
  })
  if (!session?.user || !session.user.is_active) {
    return null
  }
  await prisma.session.update({
    where: { session_id: session.session_id },
    data: { last_seen_at: new Date() }
  })

  const authUser: AuthUser = {
    user_id: session.user.user_id,
    email: session.user.email,
    username: session.user.username,
    name: session.user.name ?? null,
    role: String(session.user.role)
  }
  event.context.authUser = authUser
  return authUser
}

export const requireAuthUser = async (event: H3Event) => {
  const user = await getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })
  }
  return user
}

export const requireAdmin = async (event: H3Event) => {
  const user = await requireAuthUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
  return user
}
