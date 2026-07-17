// 第三方 AI 提供商预设配置
export interface ProviderPreset {
  id: string
  name: string
  baseUrl: string
  defaultModel: string
  models: string[]
  apiKeyUrl: string // 获取 API Key 的地址
  help: string
  // 请求格式：openai_compatible（OpenAI 兼容格式）或 custom
  format: 'openai_compatible'
}

export const AI_PROVIDERS: Record<string, ProviderPreset> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    help: 'DeepSeek API，性价比高，中文表现优秀。需在 platform.deepseek.com 获取 API Key。',
    format: 'openai_compatible',
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini', 'o1-preview'],
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    help: 'OpenAI GPT 系列模型，需在 platform.openai.com 获取 API Key。国内可能需要代理。',
    format: 'openai_compatible',
  },
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    help: 'Anthropic Claude 系列模型，擅长长文本和创作。需在 console.anthropic.com 获取 API Key。',
    format: 'openai_compatible',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini (Google)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    help: 'Google Gemini 系列模型，支持多模态。需在 aistudio.google.com 获取 API Key。',
    format: 'openai_compatible',
  },
  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-beta',
    models: ['grok-beta', 'grok-vision-beta'],
    apiKeyUrl: 'https://console.x.ai',
    help: 'xAI Grok 模型，风格独特。需在 console.x.ai 获取 API Key。',
    format: 'openai_compatible',
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-Text-01',
    models: ['MiniMax-Text-01', 'abab6.5s-chat', 'abab6.5-chat'],
    apiKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    help: 'MiniMax 大模型，中文表现优秀。需在 platform.minimaxi.com 获取 API Key。',
    format: 'openai_compatible',
  },
  custom: {
    id: 'custom',
    name: '自定义 API',
    baseUrl: '',
    defaultModel: '',
    models: [],
    apiKeyUrl: '',
    help: '支持任何 OpenAI 兼容格式的 API 端点。填写完整的 Base URL 和模型名。',
    format: 'openai_compatible',
  },
}

// 调用第三方 AI（OpenAI 兼容格式）
export async function callThirdPartyAI(
  config: {
    baseUrl: string
    apiKey: string
    model: string
  },
  messages: { role: string; content: string }[],
  options?: { stream?: boolean; temperature?: number }
): Promise<{ ok: boolean; reply?: string; error?: string; stream?: ReadableStream<Uint8Array> }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: options?.stream || false,
        ...(options?.temperature ? { temperature: options.temperature } : {}),
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` }
    }

    if (options?.stream && res.body) {
      return { ok: true, stream: res.body as ReadableStream<Uint8Array> }
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || ''
    return { ok: true, reply }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// 测试 API 连接
export async function testThirdPartyAI(config: {
  baseUrl: string
  apiKey: string
  model: string
}): Promise<{ ok: boolean; error?: string }> {
  const result = await callThirdPartyAI(config, [
    { role: 'user', content: '请回复"连接成功"四个字' },
  ])
  return result
}
