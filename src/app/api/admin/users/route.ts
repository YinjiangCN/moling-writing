import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401, userPublic } from '@/lib/auth'

// GET /api/admin/users - 用户列表
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const search = url.searchParams.get('search') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
      { penName: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        penName: true,
        avatar: true,
        tokens: true,
        plan: true,
        role: true,
        banned: true,
        createdAt: true,
        _count: { select: { novels: true, orders: true, chatMessages: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

// PATCH - 调整用户 Token / 封禁 / 角色
export async function PATCH(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, tokens, banned, role, plan } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const data: any = {}
  if (tokens !== undefined) data.tokens = Math.max(0, tokens)
  if (banned !== undefined) data.banned = banned
  if (role !== undefined) data.role = role
  if (plan !== undefined) data.plan = plan

  const user = await db.user.update({ where: { id }, data })
  return NextResponse.json({ user: userPublic(user) })
}
