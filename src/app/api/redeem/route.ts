import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { describeReward } from '@/lib/redeem'

// POST /api/redeem - 用户兑换码
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const { code: rawCode } = await req.json()
  if (!rawCode?.trim()) {
    return NextResponse.json({ error: '请输入兑换码' }, { status: 400 })
  }

  // 标准化：去空格、去分隔符、转大写
  const code = rawCode.trim().replace(/\s|-/g, '').toUpperCase()

  if (!/^[A-Z0-9]{8,20}$/.test(code)) {
    return NextResponse.json({ error: '兑换码格式不正确' }, { status: 400 })
  }

  // 查找兑换码（数据库中存的是带分隔符的格式，需要兼容）
  // 数据库中存的格式是 XXXX-XXXX-XXXX，用户可能输入 xxxxxxxxxx 或 XXX-XXXX-XXXX
  const formattedCode = code.match(/.{1,4}/g)?.join('-') || code
  const redeemCode = await db.redeemCode.findFirst({
    where: {
      OR: [{ code: formattedCode }, { code }],
    },
  })

  if (!redeemCode) {
    return NextResponse.json({ error: '兑换码不存在' }, { status: 404 })
  }

  if (redeemCode.status === 'used') {
    return NextResponse.json({ error: '该兑换码已被使用' }, { status: 400 })
  }

  if (redeemCode.status === 'disabled') {
    return NextResponse.json({ error: '该兑换码已失效' }, { status: 400 })
  }

  // 检查过期
  if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
    await db.redeemCode.update({
      where: { id: redeemCode.id },
      data: { status: 'disabled' },
    })
    return NextResponse.json({ error: '该兑换码已过期' }, { status: 400 })
  }

  // 记录兑换前状态
  const tokensBefore = user.tokens
  const planBefore = user.plan

  // 执行兑换
  let tokensAfter = tokensBefore
  let planAfter = planBefore

  if (redeemCode.rewardType === 'token') {
    tokensAfter = tokensBefore + redeemCode.tokenAmount
    await db.user.update({
      where: { id: user.id },
      data: { tokens: tokensAfter },
    })
  } else if (redeemCode.rewardType === 'plan') {
    // 简化：直接升级 plan
    planAfter = redeemCode.planReward || planBefore
    await db.user.update({
      where: { id: user.id },
      data: { plan: planAfter },
    })
    // 同时赠送对应天数的 Token 配额（演示：月卡送 50000，年卡送 500000）
    const bonusTokens = redeemCode.planDays >= 365 ? 500000 : redeemCode.planDays >= 30 ? 50000 : 0
    if (bonusTokens > 0) {
      tokensAfter = tokensBefore + bonusTokens
      await db.user.update({
        where: { id: user.id },
        data: { tokens: tokensAfter },
      })
    }
  }

  // 标记兑换码为已使用
  await db.redeemCode.update({
    where: { id: redeemCode.id },
    data: {
      status: 'used',
      usedBy: user.id,
      usedAt: new Date(),
    },
  })

  // 记录兑换历史
  await db.redeemHistory.create({
    data: {
      codeId: redeemCode.id,
      code: redeemCode.code,
      userId: user.id,
      rewardType: redeemCode.rewardType,
      tokenAmount: redeemCode.tokenAmount,
      planReward: redeemCode.planReward,
      planDays: redeemCode.planDays,
      tokensBefore,
      tokensAfter,
      planBefore,
      planAfter,
    },
  })

  const rewardDesc = describeReward(redeemCode)

  return NextResponse.json({
    ok: true,
    rewardDesc,
    tokensBefore,
    tokensAfter,
    planBefore,
    planAfter,
    message: `兑换成功！获得 ${rewardDesc}`,
  })
}

// GET /api/redeem/history - 当前用户的兑换记录
export async function GET() {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const history = await db.redeemHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { redeemedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ history })
}
