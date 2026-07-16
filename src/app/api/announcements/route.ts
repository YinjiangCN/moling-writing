import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/announcements - 用户查看已发布公告
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const onlyUnread = url.searchParams.get('unread') === 'true'

  const now = new Date()
  const where: any = {
    published: true,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    AND: [
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    ],
  }

  const [items, total] = await Promise.all([
    db.announcement.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reads: {
          where: { userId: session.user.id },
          select: { id: true, readAt: true },
        },
      },
    }),
    db.announcement.count({ where }),
  ])

  // 置顶公告单独取
  const pinned = await db.announcement.findMany({
    where: { ...where, pinned: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      reads: { where: { userId: session.user.id }, select: { id: true } },
    },
  })

  // 未读数
  const allPublished = await db.announcement.findMany({
    where,
    select: { id: true },
  })
  const readIds = await db.announcementRead.findMany({
    where: { userId: session.user.id },
    select: { announcementId: true },
  })
  const readSet = new Set(readIds.map((r) => r.announcementId))
  const unreadCount = allPublished.filter((a) => !readSet.has(a.id)).length

  let result = items
  if (onlyUnread) {
    result = items.filter((a) => a.reads.length === 0)
  }

  return NextResponse.json({
    items: result.map((a) => ({ ...a, isRead: a.reads.length > 0 })),
    total: onlyUnread ? result.length : total,
    page,
    pageSize,
    unreadCount,
    pinned: pinned.map((a) => ({ ...a, isRead: a.reads.length > 0 })),
  })
}

// POST /api/announcements/read?id=xxx - 标记公告已读
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  // upsert 已读记录
  const existing = await db.announcementRead.findUnique({
    where: {
      announcementId_userId: { announcementId: id, userId: session.user.id },
    },
  })
  if (!existing) {
    await db.announcementRead.create({
      data: { announcementId: id, userId: session.user.id },
    })
  }

  return NextResponse.json({ ok: true })
}
