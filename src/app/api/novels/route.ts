import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getCurrentUser() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: {
        email: 'writer@aistory.com',
        name: '资深码字人',
        penName: '云中鹤',
        tokens: 88888,
        plan: 'pro',
      },
    })
  }
  return user
}

// GET /api/novels?folderId=xxx 或 /api/novels?id=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const folderId = url.searchParams.get('folderId')

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
      },
    })
    if (!novel || novel.userId !== user.id) {
      return NextResponse.json({ error: '未找到' }, { status: 404 })
    }
    return NextResponse.json({ novel })
  }

  const where: any = { userId: user.id }
  if (folderId) where.folderId = folderId
  const novels = await db.novel.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ novels })
}

// POST /api/novels - 创建小说（可带 AI 生成内容）
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const body = await req.json()
  const { title, cover, author, genre, tags, synopsis, outline, folderId, generateFromIdea } = body

  if (!title?.trim()) return NextResponse.json({ error: '书名不能为空' }, { status: 400 })

  let finalSynopsis = synopsis || ''
  let finalOutline = outline || ''

  // 如果有灵感关键词但没有简介/大纲，可由前端先调用 AI 生成后传入
  const novel = await db.novel.create({
    data: {
      title: title.trim(),
      cover: cover || null,
      author: author || user.penName || user.name || '匿名',
      genre: genre || '玄幻',
      tags: tags || '',
      synopsis: finalSynopsis,
      outline: finalOutline,
      folderId: folderId || null,
      userId: user.id,
    },
  })

  // 默认创建第一卷和第一章
  const volume = await db.volume.create({
    data: {
      title: '第一卷',
      sortOrder: 0,
      novelId: novel.id,
    },
  })
  await db.chapter.create({
    data: {
      title: '第一章',
      sortOrder: 0,
      volumeId: volume.id,
      novelId: novel.id,
    },
  })

  return NextResponse.json({ novel })
}

// PATCH - 更新
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const allowed = ['title', 'cover', 'author', 'genre', 'tags', 'synopsis', 'outline', 'status', 'folderId']
  const updateData: any = {}
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key]
  }

  const novel = await db.novel.update({ where: { id }, data: updateData })
  return NextResponse.json({ novel })
}

// DELETE
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })
  await db.novel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
