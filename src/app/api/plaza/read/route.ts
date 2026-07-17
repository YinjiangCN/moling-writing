import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// POST /api/plaza/read - 记录阅读进度
// body: { publicationId, chapterId, chapterSortOrder, readWords }
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { publicationId, chapterId, chapterSortOrder, readWords } = body
  if (!publicationId) return NextResponse.json({ error: '需要 publicationId' }, { status: 400 })

  const pub = await db.publication.findUnique({ where: { id: publicationId } })
  if (!pub) return NextResponse.json({ error: '作品不存在' }, { status: 404 })

  // upsert 阅读记录
  const existing = await db.readRecord.findUnique({
    where: { publicationId_userId: { publicationId, userId: session.user.id } },
  })

  if (existing) {
    const updated = await db.readRecord.update({
      where: { id: existing.id },
      data: {
        chapterId: chapterId || existing.chapterId,
        lastChapterSortOrder: chapterSortOrder ?? existing.lastChapterSortOrder,
        readWords: readWords || existing.readWords,
        lastReadAt: new Date(),
      },
    })
    return NextResponse.json({ readRecord: updated })
  }

  const created = await db.readRecord.create({
    data: {
      publicationId,
      userId: session.user.id,
      chapterId: chapterId || null,
      lastChapterSortOrder: chapterSortOrder || 0,
      readWords: readWords || 0,
    },
  })
  return NextResponse.json({ readRecord: created })
}
