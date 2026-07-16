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

// 标准化用户输入的兑换码：去空格、去连字符、转大写
export function normalizeCode(input: string): string {
  return input.trim().replace(/\s|-/g, '').toUpperCase()
}

// 校验自定义兑换码格式（允许字母数字，长度 4-32）
export function isValidCustomCode(input: string): boolean {
  const normalized = normalizeCode(input)
  return /^[A-Z0-9]{4,32}$/.test(normalized)
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

// ============ CSV 导出 ============
// 转义 CSV 字段（包含逗号、引号、换行需用双引号包裹）
function escapeCsvField(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface RedeemCodeExportRow {
  code: string
  rewardType: string
  rewardDesc: string
  tokenAmount: number
  planReward: string | null
  planDays: number
  isGeneric: boolean
  isCustom: boolean
  maxUses: number
  totalUsed: number
  status: string
  batchId: string | null
  batchNote: string | null
  usedBy: string | null
  usedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
}

// 生成 CSV 内容
export function codesToCsv(rows: RedeemCodeExportRow[]): string {
  const headers = [
    '兑换码', '奖励类型', '奖励描述', 'Token数量', '会员类型', '会员天数',
    '是否通用码', '是否自定义', '最大使用次数', '已使用次数',
    '状态', '批次ID', '批次备注', '使用者ID', '使用时间', '过期时间', '创建时间',
  ]
  const lines = [headers.map(escapeCsvField).join(',')]

  for (const row of rows) {
    const statusText =
      row.status === 'unused' ? '未使用' :
      row.status === 'used' ? '已使用' :
      row.status === 'disabled' ? '已禁用' : row.status

    const fields = [
      row.code,
      row.rewardType === 'token' ? 'Token' : row.rewardType === 'plan' ? '会员' : row.rewardType,
      row.rewardDesc,
      row.tokenAmount,
      row.planReward || '',
      row.planDays,
      row.isGeneric ? '是' : '否',
      row.isCustom ? '是' : '否',
      row.maxUses,
      row.totalUsed,
      statusText,
      row.batchId || '',
      row.batchNote || '',
      row.usedBy || '',
      row.usedAt ? new Date(row.usedAt).toLocaleString('zh-CN') : '',
      row.expiresAt ? new Date(row.expiresAt).toLocaleString('zh-CN') : '永久',
      new Date(row.createdAt).toLocaleString('zh-CN'),
    ]
    lines.push(fields.map(escapeCsvField).join(','))
  }

  // 加 BOM 头让 Excel 正确识别 UTF-8
  return '\ufeff' + lines.join('\r\n')
}

