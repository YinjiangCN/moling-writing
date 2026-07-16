import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { ZipArchive } from 'archiver'

// GET /api/export/zip?novelId=xxx&format=txt|markdown
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const novelId = url.searchParams.get('novelId')
  const format = url.searchParams.get('format') || 'txt'

  if (!novelId) {
    return NextResponse.json({ error: '需要 novelId' }, { status: 400 })
  }
  if (!['txt', 'markdown'].includes(format)) {
    return NextResponse.json({ error: '不支持的格式，仅支持 txt / markdown' }, { status: 400 })
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

  const ext = format === 'markdown' ? 'md' : 'txt'
  // 安全的文件名（去除非法字符）
  const sanitize = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled'
  const bookName = sanitize(novel.title)
  const isMarkdown = format === 'markdown'

  // 创建 archiver 实例
  const archive = new ZipArchive({
    zlib: { level: 6 }, // 压缩级别
  })

  // 处理错误
  const errors: string[] = []
  archive.on('error', (err: Error) => {
    errors.push(err.message)
  })

  // 添加 README 文件（书的元信息）
  let readmeContent = `${novel.title}\n`
  if (novel.author) readmeContent += `作者：${novel.author}\n`
  readmeContent += `类型：${novel.genre}\n`
  if (novel.tags) readmeContent += `标签：${novel.tags}\n`
  readmeContent += `\n${'='.repeat(40)}\n\n`
  if (novel.synopsis) readmeContent += `简介：\n${novel.synopsis}\n\n`
  if (novel.outline) readmeContent += `大纲：\n${novel.outline}\n\n`
  readmeContent += `${'='.repeat(40)}\n\n`
  readmeContent += `导出时间：${new Date().toLocaleString('zh-CN')}\n`
  readmeContent += `共 ${novel.volumes.length} 卷，${novel.volumes.reduce((s, v) => s + v.chapters.length, 0)} 章\n`
  readmeContent += `总字数：${novel.totalWords} 字\n`

  archive.append(readmeContent, { name: 'README.txt' })

  // 按卷组织文件夹
  for (const [volIdx, vol] of novel.volumes.entries()) {
    const volFolderName = `${String(volIdx + 1).padStart(2, '0')}_${sanitize(vol.title)}`
    
    // 卷简介文件
    let volInfo = `【${vol.title}】\n`
    if (vol.isOutline) volInfo += '（大纲卷）\n'
    volInfo += `共 ${vol.chapters.length} 章\n`
    archive.append(volInfo, { name: `${volFolderName}/_卷说明.txt` })

    // 章节文件
    for (const [chIdx, ch] of vol.chapters.entries()) {
      const chNum = String(chIdx + 1).padStart(3, '0')
      const chFileName = `${chNum}_${sanitize(ch.title)}.${ext}`
      let chContent: string
      if (isMarkdown) {
        chContent = `# ${ch.title}\n\n${ch.content}\n`
      } else {
        chContent = `${ch.title}\n\n${ch.content}\n`
      }
      archive.append(chContent, { name: `${volFolderName}/${chFileName}` })
    }
  }

  // 标记 archive 完成添加
  archive.finalize()

  // 将 archive 转成 Web ReadableStream
  const stream = archive as unknown as NodeJS.ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk))
      })
      stream.on('end', () => {
        controller.close()
      })
      stream.on('error', (err: Error) => {
        controller.error(err)
      })
    },
  })

  const filename = `${bookName}.zip`

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
