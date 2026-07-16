import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/messages - 用户查看自己的消息（含群发消息）
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const onlyUnread = url.searchParams.get('unread') === 'true'

  // 个人消息（deleted=false）+ 群发消息（userId=null）
  const where: any = {
    OR: [
      { userId: session.user.id, deleted: false },
      { userId: null },
    ],
  }

  const [items, total] = await Promise.all([
    db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reads: {
          where: { userId: session.user.id },
          select: { id: true, readAt: true },
        },
      },
    }),
    db.message.count({ where }),
  ])

  // 获取用户已删除的群发消息列表
  const deletedRecords = await db.messageDeleted.findMany({
    where: { userId: session.user.id },
    select: { messageId: true },
  })
  const deletedSet = new Set(deletedRecords.map((r) => r.messageId))

  // 过滤掉已删除的群发消息
  let result = items.filter((m) => !deletedSet.has(m.id))

  // 未读数
  const readIds = await db.messageRead.findMany({
    where: { userId: session.user.id },
    select: { messageId: true },
  })
  const readSet = new Set(readIds.map((r) => r.messageId))
  const unreadCount = result.filter((m) => !readSet.has(m.id)).length

  if (onlyUnread) {
    result = result.filter((m) => !readSet.has(m.id))
  }

  return NextResponse.json({
    items: result.map((m) => ({
      ...m,
      isRead: readSet.has(m.id),
    })),
    total: onlyUnread ? result.length : result.length,
    page,
    pageSize,
    unreadCount,
  })
}

// POST /api/messages/read?id=xxx - 标记消息已读
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const msg = await db.message.findUnique({ where: { id } })
  if (!msg) return NextResponse.json({ error: '未找到' }, { status: 404 })
  if (msg.userId && msg.userId !== session.user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  const existing = await db.messageRead.findUnique({
    where: {
      messageId_userId: { messageId: id, userId: session.user.id },
    },
  })
  if (!existing) {
    await db.messageRead.create({
      data: { messageId: id, userId: session.user.id },
    })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/messages?id=xxx - 用户删除自己的消息
export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const msg = await db.message.findUnique({ where: { id } })
  if (!msg) return NextResponse.json({ error: '未找到' }, { status: 404 })

  // 个人消息：直接软删除
  if (msg.userId) {
    if (msg.userId !== session.user.id) {
      return NextResponse.json({ error: '无权删除' }, { status: 403 })
    }
    await db.message.update({ where: { id }, data: { deleted: true } })
    return NextResponse.json({ ok: true, message: '已删除' })
  }

  // 群发消息：通过 MessageDeleted 表标记
  const existing = await db.messageDeleted.findUnique({
    where: {
      messageId_userId: { messageId: id, userId: session.user.id },
    },
  })
  if (!existing) {
    await db.messageDeleted.create({
      data: { messageId: id, userId: session.user.id },
    })
  }

  return NextResponse.json({ ok: true, message: '已删除' })
}
