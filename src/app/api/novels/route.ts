import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/novels?folderId=xxx 或 /api/novels?id=xxx 或 /api/novels?trash=true
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const folderId = url.searchParams.get('folderId')
  const trash = url.searchParams.get('trash') === 'true'

  if (id) {
    const novel = await db.novel.findUnique({
      where: { id },
      include: {
        volumes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: { orderBy: { sortOrder: 'asc' } },
          },
        },
        autoSerials: true,
      },
    })
    if (!novel || novel.userId !== user.id) {
      return NextResponse.json({ error: '未找到' }, { status: 404 })
    }
    return NextResponse.json({ novel })
  }

  // 回收站列表
  if (trash) {
    const novels = await db.novel.findMany({
      where: { userId: user.id, deleted: true },
      orderBy: { deletedAt: 'desc' },
    })
    return NextResponse.json({ novels })
  }

  const where: any = { userId: user.id, deleted: false }
  if (folderId) where.folderId = folderId
  const novels = await db.novel.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ novels })
}

export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const body = await req.json()
  const { title, cover, author, genre, tags, synopsis, outline, folderId } = body

  if (!title?.trim()) return NextResponse.json({ error: '书名不能为空' }, { status: 400 })

  const novel = await db.novel.create({
    data: {
      title: title.trim(),
      cover: cover || null,
      author: author || user.penName || user.name || '匿名',
      genre: genre || '玄幻',
      tags: tags || '',
      synopsis: synopsis || '',
      outline: outline || '',
      folderId: folderId || null,
      userId: user.id,
    },
  })

  const volume = await db.volume.create({
    data: { title: '第一卷', sortOrder: 0, novelId: novel.id },
  })
  await db.chapter.create({
    data: { title: '第一章', sortOrder: 0, volumeId: volume.id, novelId: novel.id },
  })

  return NextResponse.json({ novel })
}

export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  // 恢复删除：PATCH /api/novels?id=xxx&restore=true
  const url = new URL(req.url)
  if (url.searchParams.get('restore') === 'true') {
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })
    await db.novel.update({
      where: { id },
      data: { deleted: false, deletedAt: null },
    })
    return NextResponse.json({ ok: true, message: '已从回收站恢复' })
  }

  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const allowed = ['title', 'cover', 'author', 'genre', 'tags', 'synopsis', 'outline', 'status', 'folderId', 'wordGoal']
  const updateData: any = {}
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key]
  }

  const novel = await db.novel.update({ where: { id }, data: updateData })
  return NextResponse.json({ novel })
}

// 软删除：DELETE /api/novels?id=xxx 移入回收站
//        DELETE /api/novels?id=xxx&purge=true 永久删除
// PATCH  /api/novels?id=xxx&restore=true 从回收站恢复
export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const purge = url.searchParams.get('purge') === 'true'
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  if (purge) {
    await db.novel.delete({ where: { id } })
    return NextResponse.json({ ok: true, message: '已永久删除' })
  }

  // 软删除
  await db.novel.update({
    where: { id },
    data: { deleted: true, deletedAt: new Date() },
  })
  return NextResponse.json({ ok: true, message: '已移入回收站，30 天内可恢复' })
}
