import { db } from './db'
import { callThirdPartyAI } from './ai-providers'

// 获取平台配置
export async function getPlatformConfig() {
  let config = await db.platformConfig.findUnique({ where: { id: 'default' } })
  if (!config) {
    config = await db.platformConfig.create({ data: { id: 'default' } })
  }
  return config
}

// 获取平台默认 AI 配置（如果有）
export async function getPlatformDefaultAI(): Promise<{
  baseUrl: string
  apiKey: string
  model: string
} | null> {
  const config = await getPlatformConfig()
  if (!config.defaultAiApiKey || !config.defaultAiBaseUrl || !config.defaultAiModel) {
    return null
  }
  return {
    baseUrl: config.defaultAiBaseUrl,
    apiKey: config.defaultAiApiKey,
    model: config.defaultAiModel,
  }
}

// 调用平台默认 AI（非流式）
export async function callPlatformAI(
  messages: { role: string; content: string }[]
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const aiConfig = await getPlatformDefaultAI()
  if (!aiConfig) return { ok: false, error: '平台未配置默认 AI' }

  const result = await callThirdPartyAI(aiConfig, messages)
  return result
}

// 调用平台默认 AI（流式）
export async function callPlatformAIStream(
  messages: { role: string; content: string }[]
): Promise<{ ok: boolean; stream?: ReadableStream<Uint8Array>; reply?: string; error?: string }> {
  const aiConfig = await getPlatformDefaultAI()
  if (!aiConfig) return { ok: false, error: '平台未配置默认 AI' }

  const result = await callThirdPartyAI(aiConfig, messages, { stream: true })
  return result
}
