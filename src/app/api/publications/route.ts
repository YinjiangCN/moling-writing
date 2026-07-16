import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// POST /api/publications - 发布作品到广场
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { novelId, title, synopsis, cover, tags, category } = body

  if (!novelId) return NextResponse.json({ error: '需要 novelId' }, { status: 400 })

  // 验证小说归属
  const novel = await db.novel.findUnique({ where: { id: novelId } })
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到小说' }, { status: 404 })
  }

  // 检查是否已发布
  const existing = await db.publication.findUnique({ where: { novelId } })
  if (existing) {
    return NextResponse.json({ error: '该作品已发布到广场' }, { status: 400 })
  }

  const pub = await db.publication.create({
    data: {
      novelId,
      userId: session.user.id,
      title: title || novel.title,
      synopsis: synopsis || novel.synopsis || '',
      cover: cover || novel.cover,
      tags: tags || novel.tags,
      category: category || novel.genre,
      status: 'published',
    },
  })

  return NextResponse.json({ publication: pub, message: '作品已发布到广场' })
}

// GET /api/publications - 查询自己的发布
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const novelId = url.searchParams.get('novelId')

  if (novelId) {
    const pub = await db.publication.findUnique({ where: { novelId } })
    return NextResponse.json({ publication: pub })
  }

  const publications = await db.publication.findMany({
    where: { userId: session.user.id },
    orderBy: { publishedAt: 'desc' },
  })
  return NextResponse.json({ publications })
}

// PATCH - 隐藏/显示/更新
export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, status, title, synopsis, tags, category } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const pub = await db.publication.findUnique({ where: { id } })
  if (!pub || pub.userId !== session.user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  const data: any = {}
  if (status !== undefined) data.status = status
  if (title !== undefined) data.title = title
  if (synopsis !== undefined) data.synopsis = synopsis
  if (tags !== undefined) data.tags = tags
  if (category !== undefined) data.category = category

  const updated = await db.publication.update({ where: { id }, data })
  return NextResponse.json({ publication: updated })
}

// DELETE - 撤回发布
export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const pub = await db.publication.findUnique({ where: { id } })
  if (!pub || pub.userId !== session.user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  await db.publication.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: '已从广场撤回' })
}
