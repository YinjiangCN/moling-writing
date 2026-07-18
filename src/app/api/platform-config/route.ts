import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/platform-config - 公开获取平台配置（无需登录）
export async function GET() {
  let config = await db.platformConfig.findUnique({ where: { id: 'default' } })
  if (!config) {
    config = await db.platformConfig.create({ data: { id: 'default' } })
  }

  // 只返回公开信息
  return NextResponse.json({
    platformName: config.platformName,
    platformIcon: config.platformIcon,
    platformDesc: config.platformDesc,
    mode: config.mode,
    rechargeEnabled: config.rechargeEnabled,
    customPackages: config.customPackages ? JSON.parse(config.customPackages) : [],
    registerTokens: config.registerTokens,
    hasDefaultAi: !!config.defaultAiApiKey,
  })
}
