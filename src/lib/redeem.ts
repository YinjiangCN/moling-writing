import crypto from 'crypto'
import { db } from './db'

// 生成单个兑换码（12 位，去除易混淆字符 0/O/I/1）
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateRedeemCode(length: number = 12): string {
  const bytes = crypto.randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  // 加分隔符提高可读性：XXXX-XXXX-XXXX
  return code.match(/.{1,4}/g)!.join('-')
}

// 批量生成不重复的兑换码
export async function generateUniqueCodes(count: number, length: number = 12): Promise<string[]> {
  const codes: string[] = []
  const tried = new Set<string>()
  let attempts = 0
  while (codes.length < count && attempts < count * 10) {
    const code = generateRedeemCode(length)
    if (!tried.has(code)) {
      tried.add(code)
      // 检查数据库中是否已存在
      const existing = await db.redeemCode.findUnique({ where: { code } })
      if (!existing) codes.push(code)
    }
    attempts++
  }
  if (codes.length < count) {
    throw new Error('生成兑换码失败，请重试')
  }
  return codes
}

// 计算会员到期时间（基于现有 plan，如果当前是更高级则顺延，否则从今天开始）
export function calculatePlanExpiry(
  currentPlan: string,
  currentPlanExpiresAt: Date | null,
  rewardPlan: string,
  rewardDays: number
): Date {
  // 简化策略：从当前会员到期日（如果还有效）或今天开始 + rewardDays
  const now = new Date()
  let baseDate = now

  // 如果当前已是会员且未过期，从原到期日顺延
  if (currentPlanExpiresAt && currentPlanExpiresAt > now) {
    baseDate = currentPlanExpiresAt
  }

  return new Date(baseDate.getTime() + rewardDays * 24 * 60 * 60 * 1000)
}

// 奖励类型显示文案
export function describeReward(reward: {
  rewardType: string
  tokenAmount: number
  planReward: string | null
  planDays: number
}): string {
  if (reward.rewardType === 'token') {
    return `${reward.tokenAmount.toLocaleString()} Token`
  }
  if (reward.rewardType === 'plan') {
    const planName = reward.planReward === 'year' ? '年卡' : reward.planReward === 'pro' ? '月卡' : reward.planReward
    return `${planName}会员 ${reward.planDays} 天`
  }
  return '未知奖励'
}
