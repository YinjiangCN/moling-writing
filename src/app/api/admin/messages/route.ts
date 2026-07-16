import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'
import { sendMessageEmail } from '@/lib/email'

// GET /api/admin/messages - 管理员查看所有消息
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

  const [items, total] = await Promise.all([
    db.message.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { reads: true } },
      },
    }),
    db.message.count(),
  ])

  // 统计
  const stats = {
    total: await db.message.count(),
    broadcast: await db.message.count({ where: { userId: null } }),
    personal: await db.message.count({ where: { userId: { not: null } } }),
    emailSent: await db.message.count({ where: { emailSent: true } }),
  }

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats,
  })
}

// POST - 发送消息（单发 / 群发，可选邮件通知）
export async function POST(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const {
    title,
    content,
    type = 'notice',
    // 接收范围
    targetMode = 'all', // all / paid / free / specific
    userIds = [] as string[], // targetMode=specific 时使用
    // 邮件通知
    sendEmail = false,
  } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
  }

  let sentCount = 0
  let emailSentCount = 0
  let emailFailedCount = 0
  const createdMessages: any[] = []

  // 单发模式：给指定用户发送
  if (targetMode === 'specific') {
    if (!userIds.length) {
      return NextResponse.json({ error: '请选择至少一个用户' }, { status: 400 })
    }
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    })

    for (const u of users) {
      const msg = await db.message.create({
        data: {
          userId: u.id,
          senderId: session.user.id,
          senderName: session.user.penName || session.user.name || '管理员',
          title: title.trim(),
          content: content.trim(),
          type,
          emailToSend: sendEmail ? u.email : null,
        },
      })
      createdMessages.push(msg)
      sentCount++

      if (sendEmail) {
        const r = await sendMessageEmail(u.email, {
          title, content, type,
          senderName: session.user.penName || session.user.name || '管理员',
        })
        if (r.ok) {
          emailSentCount++
          await db.message.update({ where: { id: msg.id }, data: { emailSent: true } })
        } else {
          emailFailedCount++
        }
      }
    }
  } else {
    // 群发模式：userId = null，所有符合范围的用户可见
    const msg = await db.message.create({
      data: {
        userId: null, // null 表示群发
        senderId: session.user.id,
        senderName: session.user.penName || session.user.name || '管理员',
        title: title.trim(),
        content: content.trim(),
        type,
      },
    })
    createdMessages.push(msg)
    sentCount = 1 // 群发只算 1 条消息

    // 群发邮件
    if (sendEmail) {
      const where: any = { banned: false }
      if (targetMode === 'paid') where.plan = { in: ['pro', 'year'] }
      else if (targetMode === 'free') where.plan = 'free'

      const users = await db.user.findMany({ where, select: { email: true } })
      for (const u of users) {
        const r = await sendMessageEmail(u.email, {
          title, content, type,
          senderName: session.user.penName || session.user.name || '管理员',
        })
        if (r.ok) emailSentCount++
        else emailFailedCount++
      }
      if (emailSentCount > 0) {
        await db.message.update({ where: { id: msg.id }, data: { emailSent: true } })
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sentCount,
    emailSentCount,
    emailFailedCount,
    message: `消息已发送给 ${targetMode === 'specific' ? `${sentCount} 个用户` : '所有用户'}${sendEmail ? `（邮件：成功 ${emailSentCount}，失败 ${emailFailedCount}）` : ''}`,
  })
}

// DELETE - 删除消息
export async function DELETE(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  await db.message.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: '已删除' })
}
