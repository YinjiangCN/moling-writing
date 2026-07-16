import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { describeReward, normalizeCode } from '@/lib/redeem'
import { sendRedeemNotification } from '@/lib/email'

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
  const normalizedCode = normalizeCode(rawCode)
  if (!/^[A-Z0-9]{4,32}$/.test(normalizedCode)) {
    return NextResponse.json({ error: '兑换码格式不正确' }, { status: 400 })
  }

  // 数据库中存的格式是 XXXX-XXXX-XXXX，需要兼容
  const formattedCode = normalizedCode.match(/.{1,4}/g)?.join('-') || normalizedCode
  const redeemCode = await db.redeemCode.findFirst({
    where: {
      OR: [{ code: formattedCode }, { code: normalizedCode }],
    },
  })

  if (!redeemCode) {
    return NextResponse.json({ error: '兑换码不存在' }, { status: 404 })
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

  // ============ 通用兑换码（一人一次，多人可用） ============
  if (redeemCode.isGeneric) {
    // 检查用户是否已兑换过此通用码
    const existingUse = await db.redeemUse.findUnique({
      where: {
        codeId_userId: { codeId: redeemCode.id, userId: user.id },
      },
    })
    if (existingUse) {
      return NextResponse.json({ error: '你已兑换过此兑换码，每个用户仅可兑换一次' }, { status: 400 })
    }

    // 检查是否达到最大使用次数
    if (redeemCode.maxUses > 0 && redeemCode.totalUsed >= redeemCode.maxUses) {
      return NextResponse.json({ error: '该兑换码已被领完' }, { status: 400 })
    }

    // 记录兑换前状态
    const tokensBefore = user.tokens
    const planBefore = user.plan

    // 执行奖励
    let tokensAfter = tokensBefore
    let planAfter = planBefore

    if (redeemCode.rewardType === 'token') {
      tokensAfter = tokensBefore + redeemCode.tokenAmount
      await db.user.update({
        where: { id: user.id },
        data: { tokens: tokensAfter },
      })
    } else if (redeemCode.rewardType === 'plan') {
      planAfter = redeemCode.planReward || planBefore
      await db.user.update({
        where: { id: user.id },
        data: { plan: planAfter },
      })
      const bonusTokens = redeemCode.planDays >= 365 ? 500000 : redeemCode.planDays >= 30 ? 50000 : 0
      if (bonusTokens > 0) {
        tokensAfter = tokensBefore + bonusTokens
        await db.user.update({
          where: { id: user.id },
          data: { tokens: tokensAfter },
        })
      }
    }

    // 记录使用记录（防重复兑换）
    await db.redeemUse.create({
      data: {
        codeId: redeemCode.id,
        code: redeemCode.code,
        userId: user.id,
      },
    })

    // 更新通用码统计
    const newTotalUsed = redeemCode.totalUsed + 1
    await db.redeemCode.update({
      where: { id: redeemCode.id },
      data: {
        totalUsed: newTotalUsed,
        // 达到最大使用次数后标记为已用完
        status: redeemCode.maxUses > 0 && newTotalUsed >= redeemCode.maxUses ? 'used' : 'unused',
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

    // 异步发送邮件通知（不阻塞响应）
    sendRedeemNotification(user.email, {
      code: redeemCode.code,
      rewardDesc,
      rewardType: redeemCode.rewardType,
      tokenAmount: redeemCode.tokenAmount,
      planReward: redeemCode.planReward,
      planDays: redeemCode.planDays,
      tokensBefore,
      tokensAfter,
      planBefore,
      planAfter,
    }).catch((e) => console.error('Redeem email failed:', e))

    return NextResponse.json({
      ok: true,
      rewardDesc,
      tokensBefore,
      tokensAfter,
      planBefore,
      planAfter,
      isGeneric: true,
      message: `兑换成功！获得 ${rewardDesc}`,
    })
  }

  // ============ 独占兑换码（一码一人） ============
  if (redeemCode.status === 'used') {
    return NextResponse.json({ error: '该兑换码已被使用' }, { status: 400 })
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
    planAfter = redeemCode.planReward || planBefore
    await db.user.update({
      where: { id: user.id },
      data: { plan: planAfter },
    })
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

  // 异步发送邮件通知
  sendRedeemNotification(user.email, {
    code: redeemCode.code,
    rewardDesc,
    rewardType: redeemCode.rewardType,
    tokenAmount: redeemCode.tokenAmount,
    planReward: redeemCode.planReward,
    planDays: redeemCode.planDays,
    tokensBefore,
    tokensAfter,
    planBefore,
    planAfter,
  }).catch((e) => console.error('Redeem email failed:', e))

  return NextResponse.json({
    ok: true,
    rewardDesc,
    tokensBefore,
    tokensAfter,
    planBefore,
    planAfter,
    isGeneric: false,
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
