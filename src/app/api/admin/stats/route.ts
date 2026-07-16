import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'

// GET /api/admin/stats - 平台总览
export async function GET() {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const [
    totalUsers,
    totalNovels,
    totalChapters,
    totalMessages,
    paidOrdersAgg,
    totalTokensUsed,
    autoSerialActive,
  ] = await Promise.all([
    db.user.count(),
    db.novel.count(),
    db.chapter.count(),
    db.chatMessage.count(),
    db.order.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true, tokens: true },
      _count: true,
    }),
    db.chatMessage.aggregate({ _sum: { tokensUsed: true } }),
    db.autoSerial.count({ where: { enabled: true } }),
  ])

  // 近 7 天每日新增用户与小说
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentUsers = await db.user.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  })
  const recentNovels = await db.novel.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  })

  const dailyData: Record<string, { users: number; novels: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyData[key] = { users: 0, novels: 0 }
  }
  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().slice(0, 10)
    if (dailyData[key]) dailyData[key].users++
  }
  for (const n of recentNovels) {
    const key = n.createdAt.toISOString().slice(0, 10)
    if (dailyData[key]) dailyData[key].novels++
  }

  return NextResponse.json({
    overview: {
      totalUsers,
      totalNovels,
      totalChapters,
      totalMessages,
      paidOrderCount: paidOrdersAgg._count,
      totalRevenue: paidOrdersAgg._sum.amount || 0,
      totalTokensSold: paidOrdersAgg._sum.tokens || 0,
      totalTokensUsed: totalTokensUsed._sum.tokensUsed || 0,
      autoSerialActive,
    },
    daily: Object.entries(dailyData).map(([date, v]) => ({ date, ...v })),
  })
}
