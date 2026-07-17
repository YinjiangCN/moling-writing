import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'

// GET /api/admin/ai-logs - AI 调用日志
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '30')

  const [items, total] = await Promise.all([
    db.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, penName: true } },
      },
    }),
    db.chatMessage.count(),
  ])

  // 统计
  const tokensAgg = await db.chatMessage.aggregate({
    _sum: { tokensUsed: true },
    _count: true,
  })

  // 按预设分组统计
  const presetStats = await db.chatMessage.groupBy({
    by: ['preset'],
    _count: { id: true },
    _sum: { tokensUsed: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  })

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      totalMessages: tokensAgg._count,
      totalTokensUsed: tokensAgg._sum.tokensUsed || 0,
      presetStats: presetStats.map((p) => ({
        preset: p.preset || '(无)',
        count: p._count.id,
        tokens: p._sum.tokensUsed || 0,
      })),
    },
  })
}
