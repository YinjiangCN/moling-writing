import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/chapters/revisions?chapterId=xxx
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const chapterId = url.searchParams.get('chapterId')
  if (!chapterId) return NextResponse.json({ error: '需要 chapterId' }, { status: 400 })

  // 验证章节归属
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { novel: { select: { userId: true } } },
  })
  if (!chapter || chapter.novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到' }, { status: 404 })
  }

  const revisions = await db.chapterRevision.findMany({
    where: { chapterId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ revisions, current: { content: chapter.content, words: chapter.words, title: chapter.title, updatedAt: chapter.updatedAt } })
}

// POST - 创建快照  /api/chapters/revisions?chapterId=xxx&reason=manual
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const chapterId = url.searchParams.get('chapterId')
  const reason = url.searchParams.get('reason') || 'manual'
  if (!chapterId) return NextResponse.json({ error: '需要 chapterId' }, { status: 400 })

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { novel: { select: { userId: true } } },
  })
  if (!chapter || chapter.novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到' }, { status: 404 })
  }

  // 创建快照
  const revision = await db.chapterRevision.create({
    data: {
      chapterId,
      content: chapter.content,
      words: chapter.words,
      title: chapter.title,
      reason,
    },
  })

  // 限制每章最多 30 个快照，删除最旧的
  const count = await db.chapterRevision.count({ where: { chapterId } })
  if (count > 30) {
    const oldest = await db.chapterRevision.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'asc' },
      take: count - 30,
      select: { id: true },
    })
    await db.chapterRevision.deleteMany({
      where: { id: { in: oldest.map((r) => r.id) } },
    })
  }

  return NextResponse.json({ revision, message: '已保存当前版本' })
}

// PATCH - 回滚到指定版本  /api/chapters/revisions?revisionId=xxx
export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const revisionId = url.searchParams.get('revisionId')
  if (!revisionId) return NextResponse.json({ error: '需要 revisionId' }, { status: 400 })

  const revision = await db.chapterRevision.findUnique({
    where: { id: revisionId },
    include: { chapter: { include: { novel: { select: { userId: true } } } } },
  })
  if (!revision || revision.chapter.novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到' }, { status: 404 })
  }

  // 先保存当前内容为快照（回滚前的状态）
  await db.chapterRevision.create({
    data: {
      chapterId: revision.chapterId,
      content: revision.chapter.content,
      words: revision.chapter.words,
      title: revision.chapter.title,
      reason: 'pre-rollback',
    },
  })

  // 回滚章节内容
  const words = revision.content.replace(/\s/g, '').length
  const chapter = await db.chapter.update({
    where: { id: revision.chapterId },
    data: {
      content: revision.content,
      words,
      title: revision.title,
    },
  })

  // 更新小说总字数
  const agg = await db.chapter.aggregate({
    where: { novelId: chapter.novelId },
    _sum: { words: true },
  })
  await db.novel.update({
    where: { id: chapter.novelId },
    data: { totalWords: agg._sum.words || 0 },
  })

  return NextResponse.json({ chapter, message: '已回滚到历史版本' })
}

// DELETE - 删除某个快照
export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const revisionId = url.searchParams.get('revisionId')
  if (!revisionId) return NextResponse.json({ error: '需要 revisionId' }, { status: 400 })

  await db.chapterRevision.delete({ where: { id: revisionId } })
  return NextResponse.json({ ok: true, message: '已删除该版本' })
}
