import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// POST /api/plaza/like - 点赞/取消点赞
// body: { publicationId }
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { publicationId } = body
  if (!publicationId) return NextResponse.json({ error: '需要 publicationId' }, { status: 400 })

  const existing = await db.publicationLike.findUnique({
    where: { publicationId_userId: { publicationId, userId: session.user.id } },
  })

  if (existing) {
    // 取消点赞
    await db.publicationLike.delete({ where: { id: existing.id } })
    await db.publication.update({
      where: { id: publicationId },
      data: { likeCount: { decrement: 1 } },
    })
    return NextResponse.json({ isLiked: false, message: '已取消点赞' })
  }

  // 点赞
  await db.publicationLike.create({
    data: { publicationId, userId: session.user.id },
  })
  await db.publication.update({
    where: { id: publicationId },
    data: { likeCount: { increment: 1 } },
  })
  return NextResponse.json({ isLiked: true, message: '已点赞' })
}
