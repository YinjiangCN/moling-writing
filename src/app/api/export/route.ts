import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/export?novelId=xxx&format=txt|markdown
// GET /api/export?chapterId=xxx&format=txt|markdown
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const novelId = url.searchParams.get('novelId')
  const chapterId = url.searchParams.get('chapterId')
  const format = url.searchParams.get('format') || 'txt'

  if (!['txt', 'markdown'].includes(format)) {
    return NextResponse.json({ error: '不支持的格式' }, { status: 400 })
  }

  // 单章导出
  if (chapterId) {
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: true },
    })
    if (!chapter || chapter.novel.userId !== session.user.id) {
      return NextResponse.json({ error: '未找到' }, { status: 404 })
    }

    const content =
      format === 'markdown'
        ? `# ${chapter.title}\n\n${chapter.content}\n`
        : `${chapter.title}\n\n${chapter.content}\n`

    const filename = `${chapter.title}.${format === 'markdown' ? 'md' : 'txt'}`
    return new NextResponse(content, {
      headers: {
        'Content-Type': `text/${format === 'markdown' ? 'markdown' : 'plain'}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  }

  // 全书导出
  if (!novelId) {
    return NextResponse.json({ error: '需要 novelId 或 chapterId' }, { status: 400 })
  }

  const novel = await db.novel.findUnique({
    where: { id: novelId },
    include: {
      volumes: {
        orderBy: { sortOrder: 'asc' },
        include: {
          chapters: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到' }, { status: 404 })
  }

  let content = ''
  if (format === 'markdown') {
    content += `# ${novel.title}\n\n`
    if (novel.author) content += `> 作者：${novel.author}\n\n`
    if (novel.synopsis) content += `## 简介\n\n${novel.synopsis}\n\n---\n\n`
    for (const vol of novel.volumes) {
      content += `## ${vol.title}\n\n`
      for (const ch of vol.chapters) {
        content += `### ${ch.title}\n\n${ch.content}\n\n`
      }
    }
  } else {
    content += `${novel.title}\n`
    if (novel.author) content += `作者：${novel.author}\n`
    if (novel.synopsis) content += `\n简介：${novel.synopsis}\n`
    content += `\n${'='.repeat(40)}\n\n`
    for (const vol of novel.volumes) {
      content += `【${vol.title}】\n\n`
      for (const ch of vol.chapters) {
        content += `${ch.title}\n\n${ch.content}\n\n${'-'.repeat(40)}\n\n`
      }
    }
  }

  const filename = `${novel.title}.${format === 'markdown' ? 'md' : 'txt'}`
  return new NextResponse(content, {
    headers: {
      'Content-Type': `text/${format === 'markdown' ? 'markdown' : 'plain'}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
