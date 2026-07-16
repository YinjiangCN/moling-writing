import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'

// GET /api/admin/backup?type=all|novels|users|orders
// 导出 JSON 备份
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'all'
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

  let data: any = {}
  let filename: string

  if (type === 'novels' || type === 'all') {
    data.novels = await db.novel.findMany({
      include: {
        volumes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, content: true, summary: true, words: true, status: true, sortOrder: true, autoGen: true, createdAt: true, updatedAt: true } },
          },
        },
        user: { select: { id: true, email: true, penName: true } },
      },
    })
  }

  if (type === 'users' || type === 'all') {
    data.users = await db.user.findMany({
      select: {
        id: true, email: true, name: true, penName: true, tokens: true, plan: true, role: true, banned: true, createdAt: true,
        _count: { select: { novels: true, orders: true, chatMessages: true } },
      },
    })
  }

  if (type === 'orders' || type === 'all') {
    data.orders = await db.order.findMany({
      include: { user: { select: { id: true, email: true, penName: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (type === 'settings' || type === 'all') {
    // 设定库
    data.characters = await db.character.findMany()
    data.worldviews = await db.worldview.findMany()
    data.items = await db.item.findMany()
  }

  if (type === 'all') {
    data._meta = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      counts: {
        novels: data.novels?.length || 0,
        users: data.users?.length || 0,
        orders: data.orders?.length || 0,
        characters: data.characters?.length || 0,
        worldviews: data.worldviews?.length || 0,
        items: data.items?.length || 0,
      },
    }
    filename = `moli-backup-full-${timestamp}.json`
  } else {
    filename = `moli-backup-${type}-${timestamp}.json`
  }

  const json = JSON.stringify(data, null, 2)

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
