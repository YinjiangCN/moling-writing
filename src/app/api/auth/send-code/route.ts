import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAndSaveCode, sendVerificationCode } from '@/lib/email'

// POST /api/auth/send-code - 发送验证码
export async function POST(req: NextRequest) {
  try {
    const { email, purpose = 'register' } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    const lowerEmail = email.toLowerCase().trim()

    // 注册场景：检查邮箱是否已被注册
    if (purpose === 'register') {
      const existing = await db.user.findUnique({ where: { email: lowerEmail } })
      if (existing) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 })
      }
    }

    // 频率限制：60 秒内不可重复发送
    const recent = await db.emailCode.findFirst({
      where: {
        email: lowerEmail,
        purpose,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (recent) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - recent.createdAt.getTime())) / 1000)
      return NextResponse.json(
        { error: `发送过于频繁，请 ${waitSec} 秒后再试` },
        { status: 429 }
      )
    }

    // 创建验证码并发送
    const code = await createAndSaveCode(lowerEmail, purpose)
    const result = await sendVerificationCode(lowerEmail, code, purpose)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: `验证码已发送至 ${lowerEmail}，10 分钟内有效`,
    })
  } catch (e: any) {
    console.error('send-code error:', e)
    return NextResponse.json({ error: e.message || '发送失败' }, { status: 500 })
  }
}
