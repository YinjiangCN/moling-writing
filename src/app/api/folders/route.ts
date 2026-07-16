import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'

// GET /api/folders - 获取所有文件夹（含小说数与字数）
export async function GET() {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const folders = await db.folder.findMany({
    where: { userId: user.id, parentId: null },
    include: {
      children: {
        include: {
          novels: { select: { id: true, totalWords: true } },
        },
      },
      novels: { select: { id: true, totalWords: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  const calc = (folder: any): { novelCount: number; totalWords: number } => {
    let novelCount = folder.novels?.length || 0
    let totalWords = folder.novels?.reduce((s: number, n: any) => s + (n.totalWords || 0), 0) || 0
    for (const child of folder.children || []) {
      const c = calc(child)
      novelCount += c.novelCount
      totalWords += c.totalWords
    }
    return { novelCount, totalWords }
  }

  const result = folders.map((f) => ({
    ...f,
    children: f.children?.map((c: any) => ({ ...c, ...calc(c) })),
    ...calc(f),
  }))

  return NextResponse.json({ folders: result })
}

export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  const body = await req.json()
  const { name, color = 'slate', parentId = null } = body
  if (!name?.trim()) return NextResponse.json({ error: '名称不能为空' }, { status: 400 })

  const maxOrder = await db.folder.aggregate({
    where: { userId: user.id, parentId },
    _max: { sortOrder: true },
  })

  const folder = await db.folder.create({
    data: {
      name: name.trim(),
      color,
      parentId,
      userId: user.id,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  })
  return NextResponse.json({ folder })
}

export async function PATCH(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { id, name, color, sortOrder, parentId } = body
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (color !== undefined) data.color = color
  if (sortOrder !== undefined) data.sortOrder = sortOrder
  if (parentId !== undefined) data.parentId = parentId

  const folder = await db.folder.update({ where: { id }, data })
  return NextResponse.json({ folder })
}

export async function DELETE(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })
  await db.folder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
