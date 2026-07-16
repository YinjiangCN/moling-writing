import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken, COOKIE_NAME, COOKIE_MAX_AGE, userPublic, ensureAdminUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, penName } = await req.json()
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    // 确保管理员账号存在
    await ensureAdminUser()

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashPassword(password),
        name: name || email.split('@')[0],
        penName: penName || name || email.split('@')[0],
        tokens: 10000, // 注册赠送
        plan: 'free',
        role: 'user',
      },
    })

    const token = signToken(user.id)
    const res = NextResponse.json({ user: userPublic(user) })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch (e: any) {
    console.error('register error:', e)
    return NextResponse.json({ error: e.message || '注册失败' }, { status: 500 })
  }
}
