import { cookies } from 'next/headers'
import crypto from 'crypto'
import { db } from './db'

const SECRET = process.env.JWT_SECRET || 'moli-writing-secret-2026-do-not-leak'

// ============ JWT ============
export function signToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: Date.now(), exp: Date.now() + 30 * 24 * 3600 * 1000 })
  ).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

export function verifyToken(token: string): { userId: string; exp: number } | null {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null
    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')
    if (signature !== expected) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.exp && Date.now() > data.exp) return null
    return { userId: data.userId, exp: data.exp }
  } catch {
    return null
  }
}

// ============ 密码哈希 ============
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(':')
    if (!salt || !key) return false
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')
    // 等长比较防时序攻击
    return hash.length === key.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(key))
  } catch {
    return false
  }
}

// ============ Session ============
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.banned) return null
  return user
}

export async function requireSession() {
  const user = await getSession()
  if (!user) throw new Error('未登录或会话已过期')
  return user
}

export async function requireAdmin() {
  const user = await requireSession()
  if (user.role !== 'admin') throw new Error('需要管理员权限')
  return user
}

// 用于 API 路由的友好封装：返回 401 而不是抛出
export async function getSessionOr401() {
  try {
    const user = await getSession()
    if (!user) return { ok: false as const, error: '未登录' }
    return { ok: true as const, user }
  } catch (e: any) {
    return { ok: false as const, error: e.message }
  }
}

export async function requireSessionOr401() {
  try {
    const user = await requireSession()
    return { ok: true as const, user }
  } catch (e: any) {
    return { ok: false as const, error: e.message }
  }
}

export async function requireAdminOr401() {
  try {
    const user = await requireAdmin()
    return { ok: true as const, user }
  } catch (e: any) {
    return { ok: false as const, error: e.message }
  }
}

// 设置/清除 cookie
export const COOKIE_NAME = 'token'
export const COOKIE_MAX_AGE = 30 * 24 * 3600 // 30 天

export function userPublic(user: {
  id: string
  email: string
  name: string | null
  penName: string | null
  avatar: string | null
  tokens: number
  plan: string
  role: string
  banned: boolean
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    penName: user.penName,
    avatar: user.avatar,
    tokens: user.tokens,
    plan: user.plan,
    role: user.role,
    banned: user.banned,
    createdAt: user.createdAt,
  }
}

// 预置管理员账号（首次启动时调用）
export async function ensureAdminUser() {
  const adminEmail = 'admin@moli.com'
  const existing = await db.user.findUnique({ where: { email: adminEmail } })
  if (existing) return existing
  return db.user.create({
    data: {
      email: adminEmail,
      password: hashPassword('admin123'),
      name: '平台管理员',
      penName: '管理员',
      tokens: 999999,
      plan: 'year',
      role: 'admin',
    },
  })
}
