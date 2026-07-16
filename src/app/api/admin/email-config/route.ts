import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOr401 } from '@/lib/auth'
import { SMTP_PRESETS, sendTestEmail } from '@/lib/email'

// GET /api/admin/email-config - 获取当前配置
export async function GET() {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const config = await db.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } })

  // 返回时隐藏密码的明文，只返回是否存在
  const safeConfig = config
    ? {
        ...config,
        smtpPass: config.smtpPass ? '******' : '',
        hasPassword: !!config.smtpPass,
      }
    : null

  return NextResponse.json({ config: safeConfig, presets: SMTP_PRESETS })
}

// POST - 创建或更新配置
export async function POST(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromName, enabled } = body

  if (!smtpHost?.trim() || !smtpUser?.trim()) {
    return NextResponse.json({ error: '请填写 SMTP 服务器和邮箱账号' }, { status: 400 })
  }

  // 如果密码是 '******' 或为空，保留原密码
  const existing = await db.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } })
  let finalPass = smtpPass
  if ((!smtpPass || smtpPass === '******') && existing) {
    finalPass = existing.smtpPass
  }
  if (!finalPass) {
    return NextResponse.json({ error: '请填写邮箱密码或授权码' }, { status: 400 })
  }

  const data = {
    smtpHost: smtpHost.trim(),
    smtpPort: Number(smtpPort) || 465,
    smtpSecure: smtpSecure !== undefined ? !!smtpSecure : true,
    smtpUser: smtpUser.trim(),
    smtpPass: finalPass,
    fromName: fromName?.trim() || '墨灵写作',
    enabled: enabled !== undefined ? !!enabled : true,
  }

  let config
  if (existing) {
    config = await db.emailConfig.update({ where: { id: existing.id }, data })
  } else {
    config = await db.emailConfig.create({ data })
  }

  // 返回时隐藏密码
  const safeConfig = { ...config, smtpPass: '******', hasPassword: !!config.smtpPass }

  return NextResponse.json({ config: safeConfig })
}

// PATCH - 单独切换启用状态
export async function PATCH(req: NextRequest) {
  const session = await requireAdminOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const body = await req.json()
  const { enabled } = body

  const existing = await db.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!existing) return NextResponse.json({ error: '请先配置邮箱' }, { status: 400 })

  const config = await db.emailConfig.update({
    where: { id: existing.id },
    data: { enabled: !!enabled },
  })

  return NextResponse.json({ config: { ...config, smtpPass: '******' } })
}
