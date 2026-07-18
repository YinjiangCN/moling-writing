import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken, COOKIE_NAME, COOKIE_MAX_AGE, userPublic, ensureAdminUser, hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 })
    }

    // 确保管理员账号存在（首次登录管理员可用）
    await ensureAdminUser()

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 400 })
    }
    if (user.banned) {
      return NextResponse.json({ error: '账号已被封禁，请联系管理员' }, { status: 403 })
    }

    // 检测是否使用默认密码（admin123）
    const isDefaultPassword = user.email === 'admin@moli.com' && verifyPassword('admin123', user.password)

    const token = signToken(user.id)
    const res = NextResponse.json({
      user: userPublic(user),
      needChangePassword: isDefaultPassword,
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch (e: any) {
    console.error('login error:', e)
    return NextResponse.json({ error: e.message || '登录失败' }, { status: 500 })
  }
}
