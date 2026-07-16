import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// POST /api/plaza/collect - 收藏/取消收藏
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { publicationId } = body
  if (!publicationId) return NextResponse.json({ error: '需要 publicationId' }, { status: 400 })

  const existing = await db.publicationCollect.findUnique({
    where: { publicationId_userId: { publicationId, userId: session.user.id } },
  })

  if (existing) {
    await db.publicationCollect.delete({ where: { id: existing.id } })
    await db.publication.update({
      where: { id: publicationId },
      data: { collectCount: { decrement: 1 } },
    })
    return NextResponse.json({ isCollected: false, message: '已取消收藏' })
  }

  await db.publicationCollect.create({
    data: { publicationId, userId: session.user.id },
  })
  await db.publication.update({
    where: { id: publicationId },
    data: { collectCount: { increment: 1 } },
  })
  return NextResponse.json({ isCollected: true, message: '已收藏' })
}
