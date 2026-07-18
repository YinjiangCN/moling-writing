import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { PRESETS } from '../route'
import { callThirdPartyAI } from '@/lib/ai-providers'
import { getPlatformDefaultAI } from '@/lib/platform-ai'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/ai/stream - 流式 AI 调用（SSE）
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  if (user.tokens <= 0) {
    return NextResponse.json(
      { error: 'Token 余额不足，请充值' },
      { status: 402 }
    )
  }

  const body = await req.json()
  const { action, preset, message, novelId, chapterId, targetStyle } = body

  let systemPrompt = '你是一位专业的网文创作助手，帮助作者完成小说创作任务。回复请使用中文。'
  let userPrompt = message || ''
  let extraContext = ''

  // 注入上下文
  if (novelId) {
    const novel = await db.novel.findUnique({ where: { id: novelId } })
    if (novel) {
      extraContext += `\n【当前小说】\n书名：${novel.title}\n类型：${novel.genre}\n简介：${novel.synopsis || '（未设定）'}\n大纲：${novel.outline || '（未设定）'}\n`
    }
    if (chapterId) {
      const chapter = await db.chapter.findUnique({ where: { id: chapterId } })
      if (chapter) {
        const preview = chapter.content?.slice(-1500) || ''
        extraContext += `\n【当前章节】\n标题：${chapter.title}\n核心事件：${chapter.summary || '（未设定）'}\n前文末尾：\n${preview}\n`
      }
    }
    const characters = await db.character.findMany({ where: { novelId } })
    if (characters.length > 0) {
      extraContext += `\n【核心角色】\n${characters.map(c => `- ${c.name}：${c.personality || '（未设定性格）'} | ${c.background || '（未设定背景）'}`).join('\n')}\n`
    }
  }

  if (preset && PRESETS[preset]) {
    systemPrompt = PRESETS[preset].system
  }

  if (action === 'edit') {
    const editPrompt: Record<string, string> = {
      polish: '请润色以下文本：',
      expand: '请扩写以下文本：',
      shorten: '请缩写以下文本：',
      style_change: `请将以下文本改写为「${targetStyle || '古风'}」文风：`,
      continue: '请续写以下文本：',
    }
    userPrompt = `${editPrompt[preset] || '请处理以下文本：'}\n\n${message || ''}`
  }

  // 检查用户是否有默认第三方 API 配置
  const userAiConfig = await db.userAiConfig.findFirst({
    where: { userId: user.id, enabled: true, isDefault: true },
  })

  const messages = [
    { role: 'system', content: systemPrompt + (extraContext ? `\n\n以下是创作上下文：${extraContext}` : '') },
    { role: 'user', content: userPrompt || '请帮我继续创作。' },
  ]

  // 创建 SSE 流
  const encoder = new TextEncoder()
  let fullReply = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (userAiConfig) {
          // 使用第三方 API（流式）
          const result = await callThirdPartyAI(
            { baseUrl: userAiConfig.baseUrl, apiKey: userAiConfig.apiKey, model: userAiConfig.model },
            messages,
            { stream: true }
          )

          if (!result.ok) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: result.error })}\n\n`))
            controller.close()
            return
          }

          if (result.stream) {
            // 第三方流式响应（OpenAI 兼容 SSE 格式）
            const reader = result.stream.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })

              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim()
                  if (data === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(data)
                    const delta = parsed.choices?.[0]?.delta?.content || ''
                    if (delta) {
                      fullReply += delta
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
                    }
                  } catch {}
                }
              }
            }
          } else {
            // 非流式降级
            fullReply = result.reply || ''
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: fullReply })}\n\n`))
          }
        } else {
          // 优先级 2：检查平台默认 AI
          const platformAI = await getPlatformDefaultAI()
          if (platformAI) {
            // 使用平台默认 AI（流式）
            const result = await callThirdPartyAI(platformAI, messages, { stream: true })
            if (!result.ok) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: result.error })}\n\n`))
              controller.close()
              return
            }
            if (result.stream) {
              const reader = result.stream.getReader()
              const decoder = new TextDecoder()
              let buffer = ''
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim()
                    if (data === '[DONE]') continue
                    try {
                      const parsed = JSON.parse(data)
                      const delta = parsed.choices?.[0]?.delta?.content || ''
                      if (delta) {
                        fullReply += delta
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
                      }
                    } catch {}
                  }
                }
              }
            } else {
              fullReply = result.reply || ''
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: fullReply })}\n\n`))
            }
          } else {
            // 优先级 3：使用内置 z-ai（流式）
            const zai = await ZAI.create()
            const completion: any = await zai.chat.completions.create({
              messages,
              thinking: { type: 'disabled' },
              stream: true,
            } as any)

            const reader = (completion as ReadableStream<Uint8Array>).getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })

              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim()
                  if (data === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(data)
                    const delta = parsed.choices?.[0]?.delta?.content || ''
                    if (delta) {
                      fullReply += delta
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
                    }
                  } catch {}
                }
              }
            }
          }
        }

        // 计算消耗 + 保存记录
        const tokensUsed = Math.ceil((userPrompt.length + fullReply.length) / 3)
        await db.user.update({
          where: { id: user.id },
          data: { tokens: Math.max(0, user.tokens - tokensUsed) },
        })
        await db.chatMessage.create({
          data: {
            role: 'user',
            content: userPrompt,
            preset: preset || null,
            novelId: novelId || null,
            chapterId: chapterId || null,
            tokensUsed,
            userId: user.id,
          },
        })
        await db.chatMessage.create({
          data: {
            role: 'assistant',
            content: fullReply,
            preset: preset || null,
            novelId: novelId || null,
            chapterId: chapterId || null,
            tokensUsed,
            userId: user.id,
          },
        })

        // 发送结束事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, tokensUsed, remainingTokens: Math.max(0, user.tokens - tokensUsed) })}\n\n`))
        controller.close()
      } catch (e: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
