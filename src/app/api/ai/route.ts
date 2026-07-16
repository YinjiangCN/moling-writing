import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

// 预设指令库
export const PRESETS: Record<string, { name: string; category: string; system: string; description: string }> = {
  synopsis: {
    name: 'AI 辅助建书',
    category: '建书',
    description: '根据一句话灵感生成简介+大纲+核心角色',
    system: '你是顶级网文策划。根据用户的灵感一句话，输出三部分：1) 书籍简介（200字内，吸引人）；2) 初步大纲（5-8个核心剧情点）；3) 三个核心角色（姓名+定位+性格）。使用 markdown 格式，分别用 ## 简介、## 大纲、## 角色作为标题。',
  },
  chapter_gen: {
    name: '一键生成整章',
    category: '正文',
    description: '根据核心事件生成完整章节',
    system: '你是经验丰富的网文写手，擅长节奏紧凑、画面感强的章节。根据用户提供的核心事件和上下文，写出一个完整的章节正文，2000-3000字。直接输出正文，不要加标题或解释。',
  },
  golden_three: {
    name: '黄金三章生成',
    category: '正文',
    description: '为开篇生成抓人的前三章',
    system: '你是网文开篇大师。开篇要：1)第一章500字内出现核心矛盾或金手指；2)第二章建立世界观框架；3)第三章出现关键转折。请按章节输出，每章标明 ## 第X章 章节名。',
  },
  break_block: {
    name: '卡文破局',
    category: '辅助',
    description: '当卡住时提供3种剧情走向',
    system: '你是资深剧情顾问。用户卡文了，根据当前剧情给出3种不同方向的破局方案，每个方案包含：走向概述、关键事件、可能影响。简洁明了，给出新意。',
  },
  poison_check: {
    name: '毒点排查',
    category: '辅助',
    description: '检查文本中的毒点/雷点',
    system: '你是网文编辑，专门排查"毒点"。请检查用户文本中是否存在：1) 逻辑漏洞；2) 人设崩塌；3) 节奏拖沓；4) 三观问题；5) 抄袭嫌疑。逐条列出问题与修改建议，没有问题就回复"未发现明显毒点"。',
  },
  name_gen: {
    name: '起名器',
    category: '辅助',
    description: '生成招式/宗门/法宝名',
    system: '你是命名大师。根据用户需求，生成10个有特色的名字（招式名/宗门名/法宝名/角色名等），每个名字附带一句话风格说明。',
  },
  xuanhuan: {
    name: '玄幻打斗描写',
    category: '类型',
    description: '热血燃向的打斗场景',
    system: '你是玄幻打斗描写专家。注重招式画面感、力量层次、节奏推进。使用短句、动作动词、拟声词增强冲击力。',
  },
  yanqing: {
    name: '言情心理描写',
    category: '类型',
    description: '细腻的心理活动',
    system: '你是言情心理描写大师。注重内心独白、微妙情绪变化、眼神与小动作的暗示。多用比喻，氛围感强。',
  },
  system_panel: {
    name: '系统流面板生成',
    category: '类型',
    description: '生成系统提示面板',
    system: '你是系统流小说专家。生成符合系统流风格的提示面板，包含：【系统提示】【任务】【奖励】【当前属性】等元素，简洁有游戏感。',
  },
  polish: {
    name: '润色',
    category: '编辑',
    description: '提升文笔与流畅度',
    system: '你是文字润色专家。在保持原意和人物声音的前提下，提升用词精准度、句式节奏、画面感。直接输出润色后的文本，不加任何解释。',
  },
  expand: {
    name: '扩写',
    category: '编辑',
    description: '将简短段落扩展为详细描写',
    system: '你是扩写高手。将用户给的简短段落扩展为详细描写，加入环境、动作、心理、对话等细节，保持原有信息和基调。直接输出扩写后的文本。',
  },
  shorten: {
    name: '缩写',
    category: '编辑',
    description: '保留核心信息压缩篇幅',
    system: '你是文本压缩专家。在保留核心信息、关键对话和情感的前提下，将用户文本压缩到约一半篇幅。直接输出缩写后的文本。',
  },
  style_change: {
    name: '转换文风',
    category: '编辑',
    description: '改写为指定文风',
    system: '你是文风转换专家。根据用户指定的目标文风（如：古风/科幻/二次元/严肃文学），重写用户文本。保持原意但彻底转换语言风格。直接输出。',
  },
  continue: {
    name: '续写',
    category: '编辑',
    description: '续接当前文本',
    system: '你是续写专家。根据用户提供的上下文，自然续写500-800字。保持人物声音、情节连贯、节奏一致。直接输出续写内容，不要重复原文。',
  },
  char_dialogue: {
    name: '角色模拟对话',
    category: '辅助',
    description: '模拟两角色对话',
    system: '你是角色扮演专家。根据用户提供的两个角色设定，模拟他们之间一段5-8轮的对话，要符合各自性格，有冲突或情感流动。',
  },
  char_backstory: {
    name: '设定扩写',
    category: '设定',
    description: '扩写角色/设定背景',
    system: '你是设定扩写专家。根据用户的简单几个词，生成完整、有细节、有故事感的角色小传或背景设定，200-400字。',
  },
}

// POST /api/ai - 通用 AI 调用
export async function POST(req: NextRequest) {
  try {
    const session = await requireSessionOr401()
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
    const user = session.user

    // 余额检查
    if (user.tokens <= 0) {
      return NextResponse.json(
        { error: 'Token 余额不足，请充值', reply: '您的 Token 余额不足，请前往用户中心充值。' },
        { status: 402 }
      )
    }

    const body = await req.json()
    const { action, preset, message, context, novelId, chapterId, targetStyle } = body

    let systemPrompt = '你是一位专业的网文创作助手，帮助作者完成小说创作任务。回复请使用中文。'
    let userPrompt = message || ''
    let extraContext = ''

    // 如果有关联的小说/章节，注入上下文
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
      // 注入角色设定
      const characters = await db.character.findMany({ where: { novelId } })
      if (characters.length > 0) {
        extraContext += `\n【核心角色】\n${characters.map(c => `- ${c.name}：${c.personality || '（未设定性格）'} | ${c.background || '（未设定背景）'}`).join('\n')}\n`
      }
    }

    // 根据预设设置 system prompt
    if (preset && PRESETS[preset]) {
      systemPrompt = PRESETS[preset].system
    }

    // 编辑类操作（润色/扩写/缩写/转换文风/续写）
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

    // 调用 AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt + (extraContext ? `\n\n以下是创作上下文：${extraContext}` : '') },
        { role: 'user', content: userPrompt || '请帮我继续创作。' },
      ],
      thinking: { type: 'disabled' },
    })

    const reply = completion.choices[0]?.message?.content || '（无回复）'

    // 估算 token 消耗
    const tokensUsed = Math.ceil((userPrompt.length + reply.length) / 3)
    await db.user.update({
      where: { id: user.id },
      data: { tokens: Math.max(0, user.tokens - tokensUsed) },
    })

    // 保存对话记录
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
    const assistantMsg = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: reply,
        preset: preset || null,
        novelId: novelId || null,
        chapterId: chapterId || null,
        tokensUsed,
        userId: user.id,
      },
    })

    return NextResponse.json({
      reply,
      messageId: assistantMsg.id,
      tokensUsed,
      remainingTokens: Math.max(0, user.tokens - tokensUsed),
    })
  } catch (e: any) {
    console.error('AI error:', e)
    return NextResponse.json(
      { error: e?.message || 'AI 调用失败', reply: '抱歉，AI 服务暂时不可用，请稍后再试。' },
      { status: 500 }
    )
  }
}

// GET /api/ai/presets - 获取预设列表（需要登录）
export async function GET() {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  return NextResponse.json({
    presets: Object.entries(PRESETS).map(([id, p]) => ({ id, ...p })),
  })
}
