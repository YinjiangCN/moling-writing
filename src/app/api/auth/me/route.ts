import { NextResponse } from 'next/server'
import { getSession, userPublic, ensureAdminUser } from '@/lib/auth'

export async function GET() {
  // 确保管理员账号存在（首次访问时调用）
  await ensureAdminUser()
  const user = await getSession()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user: userPublic(user) })
}
