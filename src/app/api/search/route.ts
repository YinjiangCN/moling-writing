import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/search?q=关键词&novelId=xxx
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const novelId = url.searchParams.get('novelId')

  if (!q.trim()) {
    return NextResponse.json({ results: [] })
  }

  // 在用户的小说中搜索章节内容
  const where: any = {
    novel: { userId: session.user.id },
    content: { contains: q },
  }
  if (novelId) where.novelId = novelId

  const chapters = await db.chapter.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    take: 100,
    include: {
      novel: { select: { id: true, title: true } },
      volume: { select: { id: true, title: true } },
    },
  })

  // 构造结果，提取关键词上下文
  const results = chapters.map((c) => {
    const idx = c.content.indexOf(q)
    const start = Math.max(0, idx - 30)
    const end = Math.min(c.content.length, idx + q.length + 60)
    const preview = (start > 0 ? '...' : '') + c.content.slice(start, end) + (end < c.content.length ? '...' : '')

    // 统计出现次数
    let count = 0
    let pos = c.content.indexOf(q)
    while (pos !== -1) {
      count++
      pos = c.content.indexOf(q, pos + 1)
    }

    return {
      chapterId: c.id,
      chapterTitle: c.title,
      novelId: c.novel.id,
      novelTitle: c.novel.title,
      volumeTitle: c.volume?.title,
      preview,
      count,
    }
  })

  return NextResponse.json({ results, total: results.length })
}
