import { NextResponse } from 'next/server'
import { getSession, userPublic, ensureAdminUser, verifyPassword } from '@/lib/auth'

export async function GET() {
  // 确保管理员账号存在（首次访问时调用）
  await ensureAdminUser()
  const user = await getSession()
  if (!user) return NextResponse.json({ user: null })

  // 检测是否使用默认密码
  const isDefaultPassword = verifyPassword('admin123', user.password)

  return NextResponse.json({
    user: userPublic(user),
    needChangePassword: isDefaultPassword,
  })
}
