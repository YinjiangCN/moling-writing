import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'
import { generateUniqueCodes, describeReward, codesToCsv, normalizeCode, isValidCustomCode } from '@/lib/redeem'

// GET /api/admin/redeem-codes - 查询兑换码列表
// GET /api/admin/redeem-codes?export=csv - 导出 CSV
export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const isExport = url.searchParams.get('export') === 'csv'

  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const status = url.searchParams.get('status') || ''
  const batchId = url.searchParams.get('batchId') || ''
  const search = url.searchParams.get('search') || ''
  const isGeneric = url.searchParams.get('isGeneric') || ''

  const where: any = {}
  if (status) where.status = status
  if (batchId) where.batchId = batchId
  if (isGeneric === 'true') where.isGeneric = true
  if (isGeneric === 'false') where.isGeneric = false
  if (search) {
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { batchNote: { contains: search } },
    ]
  }

  // CSV 导出：导出最多 10000 条
  if (isExport) {
    const codes = await db.redeemCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const rows = codes.map((c) => ({
      code: c.code,
      rewardType: c.rewardType,
      rewardDesc: describeReward(c),
      tokenAmount: c.tokenAmount,
      planReward: c.planReward,
      planDays: c.planDays,
      isGeneric: c.isGeneric,
      isCustom: c.isCustom,
      maxUses: c.maxUses,
      totalUsed: c.totalUsed,
      status: c.status,
      batchId: c.batchId,
      batchNote: c.batchNote,
      usedBy: c.usedBy,
      usedAt: c.usedAt,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    }))

    const csv = codesToCsv(rows)
    const filename = `redeem-codes-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
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
        uses: true,
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
    generic: await db.redeemCode.count({ where: { isGeneric: true } }),
    custom: await db.redeemCode.count({ where: { isCustom: true } }),
  }

  return NextResponse.json({
    codes: codes.map((c) => ({
      ...c,
      rewardDesc: describeReward(c),
      useCount: c.isGeneric ? c.uses.length : (c.status === 'used' ? 1 : 0),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    batches,
    stats,
  })
}

// POST - 批量生成兑换码 或 创建自定义通用兑换码
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
    expiresAt = null,
    // 通用码相关
    isGeneric = false,
    maxUses = 0,
    // 自定义兑换码相关
    isCustom = false,
    customCode = '',
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

  // 自定义通用兑换码（管理员手动指定 code）
  if (isCustom) {
    if (!customCode?.trim()) {
      return NextResponse.json({ error: '请输入自定义兑换码' }, { status: 400 })
    }
    if (!isValidCustomCode(customCode)) {
      return NextResponse.json({ error: '兑换码格式不正确（仅字母数字，4-32 位）' }, { status: 400 })
    }
    const normalized = normalizeCode(customCode)
    const formattedCode = normalized.match(/.{1,4}/g)?.join('-') || normalized

    // 检查是否已存在
    const existing = await db.redeemCode.findFirst({
      where: {
        OR: [{ code: formattedCode }, { code: normalized }],
      },
    })
    if (existing) {
      return NextResponse.json({ error: '该兑换码已存在' }, { status: 400 })
    }

    const created = await db.redeemCode.create({
      data: {
        code: formattedCode,
        rewardType,
        tokenAmount: rewardType === 'token' ? tokenAmount : 0,
        planReward: rewardType === 'plan' ? planReward : null,
        planDays: rewardType === 'plan' ? planDays : 0,
        batchId: null,
        batchNote: batchNote || null,
        status: 'unused',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isGeneric: true, // 自定义码默认为通用码
        maxUses: maxUses || 0,
        totalUsed: 0,
        isCustom: true,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({
      ok: true,
      count: 1,
      codes: [formattedCode],
      code: created,
      message: `自定义通用兑换码「${formattedCode}」已创建`,
    })
  }

  // 批量生成（支持通用码）
  if (count < 1 || count > 1000) {
    return NextResponse.json({ error: '生成数量必须在 1-1000 之间' }, { status: 400 })
  }

  const codes = await generateUniqueCodes(count)

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

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
      isGeneric: !!isGeneric,
      maxUses: isGeneric ? (maxUses || 0) : 0,
      totalUsed: 0,
      isCustom: false,
      createdById: session.user.id,
    })),
  })

  return NextResponse.json({
    ok: true,
    batchId,
    count: created.count,
    codes,
    isGeneric: !!isGeneric,
    message: `成功生成 ${created.count} 个${isGeneric ? '通用' : '独占'}兑换码`,
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
    const code = await db.redeemCode.findUnique({ where: { id } })
    if (!code) return NextResponse.json({ error: '未找到' }, { status: 404 })
    // 独占码已使用不可启用；通用码已禁用可启用（不影响已兑换记录）
    if (!code.isGeneric && code.status === 'used') {
      return NextResponse.json({ error: '已使用的独占兑换码不能启用' }, { status: 400 })
    }
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
  const id = url.searchParams.get('id')

  // 删除单个兑换码（仅自定义码或未使用的批次码）
  if (id) {
    const code = await db.redeemCode.findUnique({ where: { id } })
    if (!code) return NextResponse.json({ error: '未找到' }, { status: 404 })
    if (!code.isGeneric && code.status === 'used') {
      return NextResponse.json({ error: '已使用的独占兑换码不能删除' }, { status: 400 })
    }
    if (code.isGeneric && code.totalUsed > 0) {
      return NextResponse.json({ error: '已有用户使用的通用码不能删除（可改为禁用）' }, { status: 400 })
    }
    await db.redeemCode.delete({ where: { id } })
    return NextResponse.json({ ok: true, message: '已删除' })
  }

  if (!batchId) return NextResponse.json({ error: '需要 batchId 或 id' }, { status: 400 })

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
