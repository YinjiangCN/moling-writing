import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  const search = url.searchParams.get('search') || ''

  const where: any = {}
  if (search) {
    where.OR = [{ title: { contains: search } }, { author: { contains: search } }]
  }

  const [novels, total] = await Promise.all([
    db.novel.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, penName: true } },
        _count: { select: { chapters: true } },
      },
    }),
    db.novel.count({ where }),
  ])

  return NextResponse.json({ novels, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}
