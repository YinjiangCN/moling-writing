import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'
import { sendTestEmail } from '@/lib/email'

// POST /api/admin/email-test - 发送测试邮件
export async function POST(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { targetEmail } = body
  if (!targetEmail?.trim()) {
    return NextResponse.json({ error: '请输入收件邮箱' }, { status: 400 })
  }

  const existing = await db.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!existing) return NextResponse.json({ error: '请先配置 SMTP' }, { status: 400 })

  const result = await sendTestEmail(targetEmail.trim())

  // 记录测试结果
  await db.emailConfig.update({
    where: { id: existing.id },
    data: {
      lastTestAt: new Date(),
      lastTestOk: result.ok,
      lastTestErr: result.ok ? null : result.error?.slice(0, 500),
    },
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: `测试邮件已发送至 ${targetEmail}` })
}
