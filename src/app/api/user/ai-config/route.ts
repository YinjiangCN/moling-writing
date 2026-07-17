import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { AI_PROVIDERS, testThirdPartyAI } from '@/lib/ai-providers'

// GET /api/user/ai-config - 获取用户的所有 AI 配置 + 提供商预设
export async function GET() {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const configs = await db.userAiConfig.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  // 隐藏 apiKey 明文，只返回末 4 位
  const safeConfigs = configs.map((c) => ({
    ...c,
    apiKey: c.apiKey ? `****${c.apiKey.slice(-4)}` : '',
    hasApiKey: !!c.apiKey,
  }))

  return NextResponse.json({
    configs: safeConfigs,
    providers: AI_PROVIDERS,
  })
}

// POST - 创建配置
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { provider, name, apiKey, baseUrl, model, isDefault } = body

  if (!provider || !apiKey?.trim()) {
    return NextResponse.json({ error: '请选择提供商并填写 API Key' }, { status: 400 })
  }

  const preset = AI_PROVIDERS[provider]
  if (!preset) {
    return NextResponse.json({ error: '未知的提供商' }, { status: 400 })
  }

  const finalBaseUrl = baseUrl?.trim() || preset.baseUrl
  const finalModel = model?.trim() || preset.defaultModel
  const finalName = name?.trim() || preset.name

  if (!finalBaseUrl) {
    return NextResponse.json({ error: '请填写 Base URL' }, { status: 400 })
  }

  // 如果设为默认，先取消其他默认
  if (isDefault) {
    await db.userAiConfig.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  const config = await db.userAiConfig.create({
    data: {
      userId: session.user.id,
      provider,
      name: finalName,
      apiKey: apiKey.trim(),
      baseUrl: finalBaseUrl,
      model: finalModel,
      isDefault: !!isDefault,
    },
  })

  return NextResponse.json({
    config: { ...config, apiKey: `****${config.apiKey.slice(-4)}`, hasApiKey: true },
    message: '配置已保存',
  })
}

// PATCH - 更新配置
export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, name, apiKey, baseUrl, model, enabled, isDefault } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const existing = await db.userAiConfig.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到配置' }, { status: 404 })
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  // apiKey 为空或 **** 开头时保留原 key
  if (apiKey && !apiKey.startsWith('****')) {
    data.apiKey = apiKey
  }
  if (baseUrl !== undefined) data.baseUrl = baseUrl
  if (model !== undefined) data.model = model
  if (enabled !== undefined) data.enabled = enabled
  if (isDefault !== undefined) {
    if (isDefault) {
      await db.userAiConfig.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }
    data.isDefault = isDefault
  }

  const config = await db.userAiConfig.update({ where: { id }, data })
  return NextResponse.json({
    config: { ...config, apiKey: `****${config.apiKey.slice(-4)}`, hasApiKey: true },
  })
}

// DELETE - 删除配置
export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const existing = await db.userAiConfig.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到配置' }, { status: 404 })
  }

  await db.userAiConfig.delete({ where: { id } })
  return NextResponse.json({ ok: true, message: '已删除' })
}
