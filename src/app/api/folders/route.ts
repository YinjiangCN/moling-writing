import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 简单的"当前用户"模拟 - 单用户系统中固定一个用户
async function getCurrentUser() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: {
        email: 'writer@aistory.com',
        name: '资深码字人',
        penName: '云中鹤',
        tokens: 88888,
        plan: 'pro',
      },
    })
  }
  return user
}

// GET /api/folders - 获取所有文件夹（含小说数与字数）
export async function GET() {
  const user = await getCurrentUser()
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

  // 计算每个文件夹的小说数和总字数（含子文件夹）
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

// POST /api/folders - 创建文件夹
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
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

// PATCH /api/folders - 更新文件夹
export async function PATCH(req: NextRequest) {
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

// DELETE /api/folders?id=xxx
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: '需要 id' }, { status: 400 })
  await db.folder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
