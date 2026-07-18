import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'

// GET - 获取平台配置（管理员）
export async function GET() {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  let config = await db.platformConfig.findUnique({ where: { id: 'default' } })
  if (!config) {
    config = await db.platformConfig.create({ data: { id: 'default' } })
  }

  // 隐藏 API Key 明文
  const safe = {
    ...config,
    defaultAiApiKey: config.defaultAiApiKey ? `****${config.defaultAiApiKey.slice(-4)}` : '',
    hasApiKey: !!config.defaultAiApiKey,
    customPackages: config.customPackages ? JSON.parse(config.customPackages) : [],
  }

  return NextResponse.json({ config: safe })
}

// POST - 更新平台配置
export async function POST(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const {
    platformName, platformIcon, platformDesc,
    mode, rechargeEnabled, customPackages,
    defaultAiProvider, defaultAiApiKey, defaultAiBaseUrl, defaultAiModel,
    registerTokens,
  } = body

  // 获取现有配置
  let config = await db.platformConfig.findUnique({ where: { id: 'default' } })
  if (!config) {
    config = await db.platformConfig.create({ data: { id: 'default' } })
  }

  const data: any = {}
  if (platformName !== undefined) data.platformName = platformName
  if (platformIcon !== undefined) data.platformIcon = platformIcon
  if (platformDesc !== undefined) data.platformDesc = platformDesc
  if (mode !== undefined) data.mode = mode
  if (rechargeEnabled !== undefined) data.rechargeEnabled = rechargeEnabled
  if (customPackages !== undefined) data.customPackages = JSON.stringify(customPackages)
  if (defaultAiProvider !== undefined) data.defaultAiProvider = defaultAiProvider
  if (defaultAiBaseUrl !== undefined) data.defaultAiBaseUrl = defaultAiBaseUrl
  if (defaultAiModel !== undefined) data.defaultAiModel = defaultAiModel
  if (registerTokens !== undefined) data.registerTokens = Number(registerTokens)

  // API Key：空或 **** 开头时保留原值
  if (defaultAiApiKey && !defaultAiApiKey.startsWith('****')) {
    data.defaultAiApiKey = defaultAiApiKey
  }

  const updated = await db.platformConfig.update({ where: { id: 'default' }, data })

  return NextResponse.json({
    config: {
      ...updated,
      defaultAiApiKey: `****${updated.defaultAiApiKey.slice(-4)}`,
      hasApiKey: !!updated.defaultAiApiKey,
      customPackages: updated.customPackages ? JSON.parse(updated.customPackages) : [],
    },
    message: '配置已保存',
  })
}
