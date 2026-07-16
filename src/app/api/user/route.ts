import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getCurrentUser() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: {
        email: 'writer@aistory.com',
        name: '资深码字人',
        penName: '云中鹤',
        tokens: 88888,
        plan: 'pro',
      },
    })
  }
  return user
}

// GET /api/user - 获取当前用户信息+统计
export async function GET() {
  const user = await getCurrentUser()

  // 今日字数
  const today = new Date().toISOString().slice(0, 10)
  const todayStat = await db.dailyStat.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  })

  // 总字数
  const totalWordsAgg = await db.novel.aggregate({
    where: { userId: user.id },
    _sum: { totalWords: true },
  })

  // 小说数
  const novelCount = await db.novel.count({ where: { userId: user.id } })

  // 最近30天热力图
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
    },
    stats: {
      todayWords: todayStat?.words || 0,
      totalWords: totalWordsAgg._sum.totalWords || 0,
      novelCount,
      heatmap: stats,
    },
  })
}

// PATCH - 更新用户信息
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  const body = await req.json()
  const { name, penName, avatar, plan } = body
  const data: any = {}
  if (name !== undefined) data.name = name
  if (penName !== undefined) data.penName = penName
  if (avatar !== undefined) data.avatar = avatar
  if (plan !== undefined) data.plan = plan

  const updated = await db.user.update({ where: { id: user.id }, data })
  return NextResponse.json({ user: updated })
}
