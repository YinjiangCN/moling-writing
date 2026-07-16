import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'
import { generateUniqueCodes, describeReward } from '@/lib/redeem'

// GET /api/admin/redeem-codes - 查询兑换码列表
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const status = url.searchParams.get('status') || ''
  const batchId = url.searchParams.get('batchId') || ''
  const search = url.searchParams.get('search') || ''

  const where: any = {}
  if (status) where.status = status
  if (batchId) where.batchId = batchId
  if (search) {
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { batchNote: { contains: search } },
    ]
  }

  const [codes, total] = await Promise.all([
    db.redeemCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        history: {
          include: {
            redeemCode: { select: { code: true } },
          },
        },
      },
    }),
    db.redeemCode.count({ where }),
  ])

  // 批次列表
  const batches = await db.redeemCode.groupBy({
    by: ['batchId', 'batchNote'],
    where: { batchId: { not: null } },
    _count: { id: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: 'desc' } },
    take: 20,
  })

  // 统计
  const stats = {
    total: await db.redeemCode.count(),
    unused: await db.redeemCode.count({ where: { status: 'unused' } }),
    used: await db.redeemCode.count({ where: { status: 'used' } }),
    disabled: await db.redeemCode.count({ where: { status: 'disabled' } }),
  }

  return NextResponse.json({
    codes: codes.map((c) => ({
      ...c,
      rewardDesc: describeReward(c),
      // 如果已使用，附上使用者信息
      user: c.history[0]
        ? null // 实际需要查询 user，这里简化
        : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    batches,
    stats,
  })
}

// POST - 批量生成兑换码
export async function POST(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const {
    count = 1,
    rewardType,
    tokenAmount = 0,
    planReward = null,
    planDays = 0,
    batchNote = '',
    expiresAt = null, // ISO 字符串或 null
  } = body

  if (!['token', 'plan'].includes(rewardType)) {
    return NextResponse.json({ error: '奖励类型必须为 token 或 plan' }, { status: 400 })
  }
  if (rewardType === 'token' && (!tokenAmount || tokenAmount <= 0)) {
    return NextResponse.json({ error: 'Token 数量必须大于 0' }, { status: 400 })
  }
  if (rewardType === 'plan') {
    if (!['pro', 'year'].includes(planReward)) {
      return NextResponse.json({ error: '会员类型必须为 pro 或 year' }, { status: 400 })
    }
    if (!planDays || planDays <= 0) {
      return NextResponse.json({ error: '会员天数必须大于 0' }, { status: 400 })
    }
  }
  if (count < 1 || count > 1000) {
    return NextResponse.json({ error: '生成数量必须在 1-1000 之间' }, { status: 400 })
  }

  const codes = await generateUniqueCodes(count)

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // 批量创建
  const created = await db.redeemCode.createMany({
    data: codes.map((code) => ({
      code,
      rewardType,
      tokenAmount: rewardType === 'token' ? tokenAmount : 0,
      planReward: rewardType === 'plan' ? planReward : null,
      planDays: rewardType === 'plan' ? planDays : 0,
      batchId,
      batchNote: batchNote || null,
      status: 'unused',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: session.user.id,
    })),
  })

  return NextResponse.json({
    ok: true,
    batchId,
    count: created.count,
    codes, // 返回生成的兑换码列表（仅本次返回，刷新页面后只能从列表查看）
    message: `成功生成 ${created.count} 个兑换码`,
  })
}

// PATCH - 禁用/启用单个兑换码
export async function PATCH(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, action } = body
  if (!id || !action) return NextResponse.json({ error: '需要 id 和 action' }, { status: 400 })

  if (action === 'disable') {
    const updated = await db.redeemCode.update({
      where: { id },
      data: { status: 'disabled' },
    })
    return NextResponse.json({ code: updated })
  }

  if (action === 'enable') {
    // 只能重新启用未使用的
    const code = await db.redeemCode.findUnique({ where: { id } })
    if (!code) return NextResponse.json({ error: '未找到' }, { status: 404 })
    if (code.status === 'used') return NextResponse.json({ error: '已使用的兑换码不能启用' }, { status: 400 })
    const updated = await db.redeemCode.update({
      where: { id },
      data: { status: 'unused' },
    })
    return NextResponse.json({ code: updated })
  }

  return NextResponse.json({ error: '未知 action' }, { status: 400 })
}

// DELETE - 删除整个批次
export async function DELETE(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const batchId = url.searchParams.get('batchId')
  if (!batchId) return NextResponse.json({ error: '需要 batchId' }, { status: 400 })

  // 只能删除未使用的
  const result = await db.redeemCode.deleteMany({
    where: { batchId, status: 'unused' },
  })

  return NextResponse.json({
    ok: true,
    deleted: result.count,
    message: `已删除 ${result.count} 个未使用的兑换码`,
  })
}
