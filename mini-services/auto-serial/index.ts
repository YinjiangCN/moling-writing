import { PrismaClient } from '/home/z/my-project/node_modules/@prisma/client'
import ZAI from '/home/z/my-project/node_modules/z-ai-web-dev-sdk'

// 配置 Prisma
const db = new PrismaClient({
  datasources: { db: { url: 'file:/home/z/my-project/db/custom.db' } },
})

const SCAN_INTERVAL = 30 * 1000 // 30 秒扫描一次
const MAX_CONCURRENT = 1 // 同时只跑 1 个生成任务

let running = false

async function processTask(task: any) {
  console.log(`[AutoSerial] 处理任务 ${task.id}，小说 ${task.novelId}`)
  try {
    // 标记为运行中
    await db.autoSerial.update({
      where: { id: task.id },
      data: { status: 'running', lastRunAt: new Date() },
    })

    // 获取小说信息
    const novel = await db.novel.findUnique({
      where: { id: task.novelId },
      include: {
        volumes: {
          orderBy: { sortOrder: 'desc' },
          take: 1,
          include: {
            chapters: { orderBy: { sortOrder: 'desc' }, take: 1 },
          },
        },
        chapters: { orderBy: { sortOrder: 'desc' }, take: 5 },
      },
    })

    if (!novel) throw new Error('小说不存在')

    // 找最后一章
    const lastChapter = novel.chapters[0]
    const lastVolume = novel.volumes[0]
    if (!lastVolume) throw new Error('小说没有卷')

    // 计算下一章序号
    const totalChapters = await db.chapter.count({ where: { novelId: novel.id } })
    const chapterNum = totalChapters + 1

    // 组装上下文
    const recentChapters = novel.chapters
      .slice(0, 3)
      .reverse()
      .map((c: any) => `第${c.sortOrder + 1}章 ${c.title}：${c.content?.slice(-500) || ''}`)
      .join('\n---\n')

    const characters = await db.character.findMany({ where: { novelId: novel.id } })
    const charInfo = characters
      .map((c: any) => `${c.name}（${c.personality || '未知性格'}，${c.abilities || '无能力'}）`)
      .join('；')

    const prompt = `请为小说《${novel.title}》创作第${chapterNum}章。
类型：${novel.genre}
简介：${novel.synopsis || '（无）'}
大纲：${novel.outline || '（无）'}
${task.plotDirection ? `剧情走向提示：${task.plotDirection}` : ''}
核心角色：${charInfo || '（无设定）'}

最近章节末尾内容：
${recentChapters || '（这是第一章）'}

要求：
1. 章节标题要符合网文风格（如：第${chapterNum}章 危机降临）
2. 正文 ${task.targetWords} 字左右
3. 自然衔接前文，推进剧情
4. 保持人物性格一致
5. 直接输出：第一行是「第X章 标题」，第二行空行，然后是正文
`

    console.log(`[AutoSerial] 调用 AI 生成第 ${chapterNum} 章...`)

    // 调用 AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            '你是专业的网文写手，擅长节奏紧凑、画面感强的章节。根据用户提供的上下文自然续写下一章。',
        },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })

    const reply = completion.choices[0]?.message?.content || ''

    // 解析标题和正文
    let title = `第${chapterNum}章`
    let content = reply
    const firstLine = reply.split('\n')[0]?.trim()
    if (firstLine && firstLine.length < 50 && (firstLine.includes('第') || firstLine.includes('章'))) {
      title = firstLine.replace(/^#+\s*/, '')
      content = reply.split('\n').slice(1).join('\n').trim()
    }

    // 保存章节
    const newChapter = await db.chapter.create({
      data: {
        title,
        content,
        summary: `AI 自动连载生成（${new Date().toLocaleString('zh-CN')}）`,
        words: content.replace(/\s/g, '').length,
        status: 'final',
        sortOrder: (lastChapter?.sortOrder || 0) + 1,
        autoGen: true,
        volumeId: lastVolume.id,
        novelId: novel.id,
      },
    })

    // 更新小说总字数
    const agg = await db.chapter.aggregate({
      where: { novelId: novel.id },
      _sum: { words: true },
    })
    await db.novel.update({
      where: { id: novel.id },
      data: { totalWords: agg._sum.words || 0, updatedAt: new Date() },
    })

    // 扣 Token
    const tokensUsed = Math.ceil((prompt.length + reply.length) / 3)
    const owner = await db.user.findUnique({ where: { id: task.userId } })
    if (owner) {
      const newTokens = Math.max(0, owner.tokens - tokensUsed)
      const tokenDepleted = newTokens <= 0
      await db.user.update({
        where: { id: owner.id },
        data: { tokens: newTokens },
      })

      // 记录对话
      await db.chatMessage.create({
        data: {
          role: 'assistant',
          content: `【自动连载】生成第${chapterNum}章「${title}」，${newChapter.words}字`,
          preset: 'auto_serial',
          novelId: novel.id,
          chapterId: newChapter.id,
          tokensUsed,
          userId: owner.id,
        },
      })

      // 计算下次运行时间
      const nextRunAt = new Date(Date.now() + task.intervalMin * 60 * 1000)
      await db.autoSerial.update({
        where: { id: task.id },
        data: {
          status: tokenDepleted ? 'error' : 'idle',
          lastError: tokenDepleted ? 'Token 余额不足' : null,
          enabled: !tokenDepleted,
          totalGenerated: { increment: 1 },
          nextRunAt,
        },
      })

      console.log(
        `[AutoSerial] ✓ 小说《${novel.title}》第${chapterNum}章已生成（${newChapter.words}字），消耗 ${tokensUsed} Token，下次执行：${nextRunAt.toLocaleString('zh-CN')}`
      )
    }
  } catch (e: any) {
    console.error(`[AutoSerial] 任务 ${task.id} 失败:`, e.message)
    // 设置下次重试（5 分钟后）+ 标记错误
    const retryAt = new Date(Date.now() + 5 * 60 * 1000)
    await db.autoSerial.update({
      where: { id: task.id },
      data: {
        status: 'error',
        lastError: e.message?.slice(0, 500) || '未知错误',
        nextRunAt: retryAt,
      },
    })
  }
}

async function scanAndRun() {
  if (running) return
  running = true
  try {
    const now = new Date()
    const dueTasks = await db.autoSerial.findMany({
      where: {
        enabled: true,
        status: { in: ['idle', 'error'] },
        nextRunAt: { lte: now },
      },
      take: MAX_CONCURRENT,
    })

    if (dueTasks.length === 0) return

    console.log(`[AutoSerial] 发现 ${dueTasks.length} 个待执行任务`)
    for (const task of dueTasks) {
      await processTask(task)
    }
  } catch (e: any) {
    console.error('[AutoSerial] 扫描失败:', e.message)
  } finally {
    running = false
  }
}

console.log(`[AutoSerial] 服务启动，每 ${SCAN_INTERVAL / 1000} 秒扫描一次`)
setInterval(scanAndRun, SCAN_INTERVAL)

// 启动时立即扫描一次
setTimeout(scanAndRun, 3000)

// 保持进程
setInterval(() => {}, 1 << 30)
