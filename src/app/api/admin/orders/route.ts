import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

  const [orders, total] = await Promise.all([
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, penName: true } },
      },
    }),
    db.order.count(),
  ])

  // 统计
  const paidOrders = await db.order.aggregate({
    where: { status: 'paid' },
    _sum: { amount: true, tokens: true },
    _count: true,
  })

  return NextResponse.json({
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      paidCount: paidOrders._count,
      paidAmount: paidOrders._sum.amount || 0,
      paidTokens: paidOrders._sum.tokens || 0,
    },
  })
}
