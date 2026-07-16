import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const novelId = url.searchParams.get('novelId')
  const id = url.searchParams.get('id')

  if (id) {
    const chapter = await db.chapter.findUnique({ where: { id } })
    if (!chapter) return NextResponse.json({ error: '未找到' }, { status: 404 })
    return NextResponse.json({ chapter })
  }

  if (!novelId) return NextResponse.json({ error: '需要 novelId' }, { status: 400 })
  const chapters = await db.chapter.findMany({
    where: { novelId },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ chapters })
}

export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { type = 'chapter', title, volumeId, novelId, isOutline = false } = body

  if (!title?.trim()) return NextResponse.json({ error: '标题不能为空' }, { status: 400 })

  if (type === 'volume') {
    const maxOrder = await db.volume.aggregate({
      where: { novelId },
      _max: { sortOrder: true },
    })
    const volume = await db.volume.create({
      data: {
        title: title.trim(),
        novelId,
        isOutline,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    })
    return NextResponse.json({ volume })
  }

  if (!volumeId) return NextResponse.json({ error: '需要 volumeId' }, { status: 400 })
  const maxOrder = await db.chapter.aggregate({
    where: { volumeId },
    _max: { sortOrder: true },
  })
  const chapter = await db.chapter.create({
    data: {
      title: title.trim(),
      volumeId,
      novelId,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  })
  return NextResponse.json({ chapter })
}

export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, content, title, status, sortOrder, summary, volumeId } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  // 先取出旧章节，用于后续计算字数增量
  const oldChapter = await db.chapter.findUnique({ where: { id } })
  if (!oldChapter) return NextResponse.json({ error: '未找到章节' }, { status: 404 })

  const data: any = {}
  let newWords: number | null = null
  if (content !== undefined) {
    data.content = content
    newWords = content.replace(/\s/g, '').length
    data.words = newWords
  }
  if (title !== undefined) data.title = title
  if (status !== undefined) data.status = status
  if (sortOrder !== undefined) data.sortOrder = sortOrder
  if (summary !== undefined) data.summary = summary
  if (volumeId !== undefined) data.volumeId = volumeId

  const chapter = await db.chapter.update({ where: { id }, data })

  if (newWords !== null && chapter.novelId) {
    const agg = await db.chapter.aggregate({
      where: { novelId: chapter.novelId },
      _sum: { words: true },
    })
    await db.novel.update({
      where: { id: chapter.novelId },
      data: { totalWords: agg._sum.words || 0 },
    })

    // 计算今日增量：新字数 - 旧字数（用 update 前的 oldChapter）
    const delta = Math.max(0, newWords - (oldChapter.words || 0))
    const today = new Date().toISOString().slice(0, 10)
    const user = await db.user.findFirst({ where: { novels: { some: { id: chapter.novelId } } } })
    if (user && delta > 0) {
      const existing = await db.dailyStat.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      })
      if (existing) {
        await db.dailyStat.update({
          where: { id: existing.id },
          data: { words: existing.words + delta },
        })
      } else {
        await db.dailyStat.create({
          data: { userId: user.id, date: today, words: delta },
        })
      }
    }
  }

  return NextResponse.json({ chapter })
}

export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const type = url.searchParams.get('type')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  if (type === 'volume') {
    await db.volume.delete({ where: { id } })
  } else {
    await db.chapter.delete({ where: { id } })
  }
  return NextResponse.json({ ok: true })
}
