import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'
import { sendAnnouncementEmail } from '@/lib/email'

// GET /api/admin/announcements - 公告列表
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const published = url.searchParams.get('published') // 'true' / 'false' / undefined

  const where: any = {}
  if (published === 'true') where.published = true
  if (published === 'false') where.published = false

  const [items, total] = await Promise.all([
    db.announcement.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { reads: true } },
      },
    }),
    db.announcement.count({ where }),
  ])

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      total: await db.announcement.count(),
      published: await db.announcement.count({ where: { published: true } }),
      draft: await db.announcement.count({ where: { published: false } }),
      pinned: await db.announcement.count({ where: { pinned: true } }),
    },
  })
}

// POST - 创建公告
export async function POST(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { title, content, type = 'info', published = false, pinned = false, publishAt, expiresAt, sendEmail = false, emailTarget = 'all' } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
  }

  const announcement = await db.announcement.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      type,
      published: !!published,
      pinned: !!pinned,
      publishAt: publishAt ? new Date(publishAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: session.user.id,
    },
  })

  // 如果立即发布且需要发邮件通知
  if (published && sendEmail) {
    // 异步发送邮件（不阻塞响应）
    ;(async () => {
      try {
        // 获取目标用户邮箱
        const where: any = { banned: false }
        if (emailTarget === 'paid') where.plan = { in: ['pro', 'year'] }
        else if (emailTarget === 'free') where.plan = 'free'

        const users = await db.user.findMany({
          where,
          select: { email: true },
        })

        let sent = 0
        let failed = 0
        for (const u of users) {
          const r = await sendAnnouncementEmail(u.email, {
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            publishAt: announcement.publishAt,
          })
          if (r.ok) sent++
          else failed++
        }
        console.log(`[Announcement ${announcement.id}] 邮件发送完成：成功 ${sent}，失败 ${failed}`)
      } catch (e: any) {
        console.error('群发公告邮件失败:', e.message)
      }
    })()
  }

  return NextResponse.json({ announcement, message: published ? '公告已发布' : '草稿已保存' })
}

// PATCH - 更新公告
export async function PATCH(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, title, content, type, published, pinned, publishAt, expiresAt, sendEmail, emailTarget = 'all' } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const existing = await db.announcement.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: '未找到' }, { status: 404 })

  const wasPublished = existing.published
  const data: any = {}
  if (title !== undefined) data.title = title.trim()
  if (content !== undefined) data.content = content.trim()
  if (type !== undefined) data.type = type
  if (published !== undefined) data.published = !!published
  if (pinned !== undefined) data.pinned = !!pinned
  if (publishAt !== undefined) data.publishAt = publishAt ? new Date(publishAt) : null
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null

  const announcement = await db.announcement.update({ where: { id }, data })

  // 如果从草稿变发布且需要发邮件
  if (!wasPublished && published && sendEmail) {
    ;(async () => {
      try {
        const where: any = { banned: false }
        if (emailTarget === 'paid') where.plan = { in: ['pro', 'year'] }
        else if (emailTarget === 'free') where.plan = 'free'

        const users = await db.user.findMany({ where, select: { email: true } })
        let sent = 0, failed = 0
        for (const u of users) {
          const r = await sendAnnouncementEmail(u.email, {
            title: announcement.title, content: announcement.content,
            type: announcement.type, publishAt: announcement.publishAt,
          })
          if (r.ok) sent++
          else failed++
        }
        console.log(`[Announcement ${announcement.id}] 邮件发送完成：成功 ${sent}，失败 ${failed}`)
      } catch (e: any) {
        console.error('群发公告邮件失败:', e.message)
      }
    })()
  }

  return NextResponse.json({ announcement, message: '已更新' })
}

// DELETE
export async function DELETE(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  await db.announcement.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: '已删除' })
}
