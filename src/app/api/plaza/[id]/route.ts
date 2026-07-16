import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/plaza/{id} - 作品详情（公开）
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const pub = await db.publication.findUnique({
    where: { id },
    include: {
      novel: {
        select: {
          id: true, title: true, author: true, genre: true, synopsis: true,
          totalWords: true, status: true,
          volumes: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true, title: true, sortOrder: true,
              chapters: {
                orderBy: { sortOrder: 'asc' },
                select: { id: true, title: true, sortOrder: true, words: true },
              },
            },
          },
        },
      },
      user: { select: { id: true, penName: true, name: true, avatar: true } },
      _count: { select: { likes: true, collects: true, reads: true } },
    },
  })

  if (!pub || pub.status !== 'published') {
    return NextResponse.json({ error: '作品不存在或已下架' }, { status: 404 })
  }

  // 增加浏览量
  await db.publication.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  // 当前用户是否已点赞/收藏 + 阅读进度
  const session = await getSession()
  let userState = { isLiked: false, isCollected: false, readProgress: null as any }
  if (session) {
    const [like, collect, read] = await Promise.all([
      db.publicationLike.findUnique({
        where: { publicationId_userId: { publicationId: id, userId: session.id } },
      }),
      db.publicationCollect.findUnique({
        where: { publicationId_userId: { publicationId: id, userId: session.id } },
      }),
      db.readRecord.findUnique({
        where: { publicationId_userId: { publicationId: id, userId: session.id } },
      }),
    ])
    userState = {
      isLiked: !!like,
      isCollected: !!collect,
      readProgress: read ? {
        chapterId: read.chapterId,
        lastChapterSortOrder: read.lastChapterSortOrder,
        readWords: read.readWords,
        lastReadAt: read.lastReadAt,
      } : null,
    }
  }

  return NextResponse.json({
    publication: {
      ...pub,
      likeCount: pub._count.likes,
      collectCount: pub._count.collects,
      readerCount: pub._count.reads,
    },
    userState,
    isLogged: !!session,
  })
}
