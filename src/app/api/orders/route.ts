import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { getPlatformConfig } from '@/lib/platform-ai'

// 默认套餐配置（当平台未配置自定义套餐时使用）
export const DEFAULT_PACKAGES = [
  { id: 'starter', tokens: 50000, price: 9.9, name: '入门体验', popular: false },
  { id: 'standard', tokens: 200000, price: 29.9, name: '常用之选', popular: true },
  { id: 'pro', tokens: 1000000, price: 99.9, name: '深度创作', popular: false },
]

// 获取当前套餐列表（优先使用平台配置的自定义套餐）
export async function getPackages() {
  const config = await getPlatformConfig()
  if (config.customPackages) {
    try {
      const custom = JSON.parse(config.customPackages)
      if (Array.isArray(custom) && custom.length > 0) {
        return custom
      }
    } catch {}
  }
  return DEFAULT_PACKAGES
}

// GET /api/orders - 当前用户的订单列表
export async function GET() {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const packages = await getPackages()
  const config = await getPlatformConfig()

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ orders, packages })
}

// POST /api/orders - 创建订单
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const body = await req.json()
  const { packageId, method = 'alipay' } = body

  const packages = await getPackages()
  const pkg = packages.find((p) => p.id === packageId)
  if (!pkg) return NextResponse.json({ error: '套餐不存在' }, { status: 400 })

  const order = await db.order.create({
    data: {
      userId: user.id,
      amount: pkg.price,
      tokens: pkg.tokens,
      method,
      status: 'pending',
    },
  })

  return NextResponse.json({ order, package: pkg })
}

// PATCH /api/orders?id=xxx&status=paid - 模拟支付回调
export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const order = await db.order.findUnique({ where: { id } })
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }
  if (order.status === 'paid') {
    return NextResponse.json({ error: '订单已支付' }, { status: 400 })
  }

  // 事务：更新订单 + 增加 Token
  await db.$transaction([
    db.order.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    }),
    db.user.update({
      where: { id: user.id },
      data: { tokens: { increment: order.tokens } },
    }),
  ])

  const updatedUser = await db.user.findUnique({ where: { id: user.id } })
  return NextResponse.json({
    ok: true,
    order: { ...order, status: 'paid', paidAt: new Date() },
    newBalance: updatedUser?.tokens,
  })
}
