import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/auto-serial?novelId=xxx - 获取小说的自动连载任务
export async function GET(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const novelId = url.searchParams.get('novelId')
  if (!novelId) return NextResponse.json({ error: '需要 novelId' }, { status: 400 })

  // 确认小说归属
  const novel = await db.novel.findUnique({ where: { id: novelId } })
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到' }, { status: 404 })
  }

  let task = await db.autoSerial.findFirst({ where: { novelId } })
  if (!task) {
    // 默认创建一个未启用的任务
    task = await db.autoSerial.create({
      data: {
        novelId,
        userId: session.user.id,
        enabled: false,
        intervalMin: 60,
        targetWords: 2000,
        status: 'idle',
      },
    })
  }

  return NextResponse.json({ task })
}

// POST - 创建/更新任务
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { novelId, enabled, intervalMin, targetWords, plotDirection } = body

  if (!novelId) return NextResponse.json({ error: '需要 novelId' }, { status: 400 })
  const novel = await db.novel.findUnique({ where: { id: novelId } })
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: '未找到' }, { status: 404 })
  }

  let task = await db.autoSerial.findFirst({ where: { novelId } })
  const data: any = {}
  if (enabled !== undefined) {
    data.enabled = enabled
    data.status = enabled ? 'idle' : 'paused'
    if (enabled) {
      data.nextRunAt = new Date() // 启用时立即触发一次
    }
  }
  if (intervalMin !== undefined) data.intervalMin = Math.max(5, intervalMin)
  if (targetWords !== undefined) data.targetWords = Math.max(500, targetWords)
  if (plotDirection !== undefined) data.plotDirection = plotDirection

  if (task) {
    task = await db.autoSerial.update({ where: { id: task.id }, data })
  } else {
    task = await db.autoSerial.create({
      data: {
        novelId,
        userId: session.user.id,
        enabled: enabled ?? false,
        intervalMin: intervalMin ?? 60,
        targetWords: targetWords ?? 2000,
        plotDirection: plotDirection ?? null,
        status: enabled ? 'idle' : 'idle',
        nextRunAt: enabled ? new Date() : null,
        ...data,
      },
    })
  }

  return NextResponse.json({ task })
}

// 立即触发一次生成（手动调用）
// POST /api/auto-serial/run?novelId=xxx
export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const novelId = url.searchParams.get('novelId')

  if (!novelId) return NextResponse.json({ error: '需要 novelId' }, { status: 400 })

  const task = await db.autoSerial.findFirst({ where: { novelId } })
  if (!task) return NextResponse.json({ error: '任务不存在' }, { status: 404 })
  if (task.userId !== session.user.id) return NextResponse.json({ error: '无权操作' }, { status: 403 })

  if (action === 'run-now') {
    // 设置下次执行时间为现在，mini-service 会扫描到
    await db.autoSerial.update({
      where: { id: task.id },
      data: { nextRunAt: new Date(), status: 'idle' },
    })
    return NextResponse.json({ ok: true, message: '已加入生成队列' })
  }

  if (action === 'pause') {
    const updated = await db.autoSerial.update({
      where: { id: task.id },
      data: { enabled: false, status: 'paused' },
    })
    return NextResponse.json({ task: updated })
  }

  if (action === 'resume') {
    const updated = await db.autoSerial.update({
      where: { id: task.id },
      data: { enabled: true, status: 'idle', nextRunAt: new Date() },
    })
    return NextResponse.json({ task: updated })
  }

  return NextResponse.json({ error: '未知 action' }, { status: 400 })
}
