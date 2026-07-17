import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/plaza - 作品广场列表（公开，无需登录）
// ?page=1&pageSize=20&category=玄幻&search=xxx&sort=latest|hot|featured
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const category = url.searchParams.get('category') || ''
  const search = url.searchParams.get('search') || ''
  const sort = url.searchParams.get('sort') || 'latest'

  const where: any = { status: 'published' }
  if (category) where.category = category
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { synopsis: { contains: search } },
      { tags: { contains: search } },
    ]
  }

  const orderBy: any =
    sort === 'hot' ? { viewCount: 'desc' } :
    sort === 'featured' ? [{ featured: 'desc' }, { viewCount: 'desc' }] :
    { publishedAt: 'desc' }

  const [items, total] = await Promise.all([
    db.publication.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        novel: {
          select: { id: true, totalWords: true, author: true, status: true },
        },
        _count: { select: { likes: true, collects: true } },
      },
    }),
    db.publication.count({ where }),
  ])

  // 当前用户是否已点赞/收藏
  const session = await getSession()
  let userInteractions: { liked: Set<string>; collected: Set<string> } = { liked: new Set(), collected: new Set() }
  if (session) {
    const [likes, collects] = await Promise.all([
      db.publicationLike.findMany({ where: { userId: session.id }, select: { publicationId: true } }),
      db.publicationCollect.findMany({ where: { userId: session.id }, select: { publicationId: true } }),
    ])
    userInteractions = {
      liked: new Set(likes.map((l) => l.publicationId)),
      collected: new Set(collects.map((c) => c.publicationId)),
    }
  }

  return NextResponse.json({
    items: items.map((p) => ({
      ...p,
      likeCount: p._count.likes,
      collectCount: p._count.collects,
      isLiked: userInteractions.liked.has(p.id),
      isCollected: userInteractions.collected.has(p.id),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    isLogged: !!session,
  })
}
