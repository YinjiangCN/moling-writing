import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401, hashPassword, verifyPassword } from '@/lib/auth'

// POST /api/auth/change-password - 修改密码
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })

  const { currentPassword, newPassword, newEmail, newName } = await req.json()

  // 验证当前密码
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '请填写当前密码和新密码' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: '新密码至少 6 位' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  if (!verifyPassword(currentPassword, user.password)) {
    return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
  }

  // 检查新密码不能与默认密码相同
  if (newPassword === 'admin123') {
    return NextResponse.json({ error: '新密码不能与默认密码相同' }, { status: 400 })
  }

  // 更新密码 + 可选更新邮箱和用户名
  const data: any = {
    password: hashPassword(newPassword),
  }
  if (newEmail?.trim() && newEmail !== user.email) {
    // 检查邮箱是否已被使用
    const existing = await db.user.findUnique({ where: { email: newEmail.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已被使用' }, { status: 400 })
    }
    data.email = newEmail.toLowerCase()
  }
  if (newName?.trim()) {
    data.name = newName.trim()
  }

  await db.user.update({ where: { id: user.id }, data })

  return NextResponse.json({ ok: true, message: '账号信息已更新，请重新登录' })
}
