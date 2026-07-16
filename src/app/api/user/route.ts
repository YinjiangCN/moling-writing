import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/user - 获取当前用户信息+统计
export async function GET() {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const today = new Date().toISOString().slice(0, 10)
  const todayStat = await db.dailyStat.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  })

  const totalWordsAgg = await db.novel.aggregate({
    where: { userId: user.id },
    _sum: { totalWords: true },
  })

  const novelCount = await db.novel.count({ where: { userId: user.id } })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60)
  const stats = await db.dailyStat.findMany({
    where: { userId: user.id, date: { gte: thirtyDaysAgo.toISOString().slice(0, 10) } },
  })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      penName: user.penName,
      email: user.email,
      avatar: user.avatar,
      tokens: user.tokens,
      plan: user.plan,
      role: user.role,
    },
    stats: {
      todayWords: todayStat?.words || 0,
      totalWords: totalWordsAgg._sum.totalWords || 0,
      novelCount,
      heatmap: stats,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const body = await req.json()
  const { name, penName, avatar, plan } = body
  const data: any = {}
  if (name !== undefined) data.name = name
  if (penName !== undefined) data.penName = penName
  if (avatar !== undefined) data.avatar = avatar
  if (plan !== undefined) data.plan = plan

  // 注意：tokens 由充值 API 修改，不在此处直接设置
  const updated = await db.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ user: updated })
}
