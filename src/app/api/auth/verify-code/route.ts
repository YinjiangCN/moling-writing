import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/email'

// POST /api/auth/verify-code - 验证验证码（不直接注册，只是校验）
export async function POST(req: NextRequest) {
  try {
    const { email, code, purpose = 'register' } = await req.json()

    if (!email?.trim() || !code) {
      return NextResponse.json({ error: '请输入邮箱和验证码' }, { status: 400 })
    }

    const result = await verifyCode(email.toLowerCase().trim(), code, purpose)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: '验证码正确' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
