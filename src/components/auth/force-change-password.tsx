'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Shield, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
}

export function ForceChangePasswordDialog({ open, onClose }: Props) {
  const { user, setUser, setView } = useAppStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState(user?.email === 'admin@moli.com' ? '' : (user?.email || ''))
  const [newName, setNewName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)

  const handleChange = async () => {
    if (!currentPassword) {
      toast.error('请输入当前密码')
      return
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少 6 位')
      return
    }
    if (newPassword === 'admin123') {
      toast.error('新密码不能与默认密码相同')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }

    setLoading(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newEmail: newEmail || undefined,
          newName: newName || undefined,
        }),
      })
      toast.success('账号信息已更新，请重新登录')
      // 退出登录
      await api('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setView('login')
      onClose()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isDefaultEmail = user?.email === 'admin@moli.com'

  return (
    <Dialog open={open} onOpenChange={() => { /* 不允许关闭 */ }}>
      <DialogContent className="max-w-md" closable={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            安全提醒
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 警告信息 */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
              <Shield className="w-3.5 h-3.5" />
              检测到您正在使用默认管理员账号
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              出于安全考虑，请立即修改账号邮箱和密码。默认密码 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">admin123</code> 已公开在 README 中，存在安全风险。
            </p>
          </div>

          {/* 当前密码 */}
          <div className="space-y-1.5">
            <Label className="text-xs">当前密码 *</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="admin123"
              className="h-9"
            />
          </div>

          {/* 修改邮箱（可选） */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              登录邮箱 {isDefaultEmail && <span className="text-amber-600">（建议修改）</span>}
            </Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-9"
            />
          </div>

          {/* 修改用户名（可选） */}
          <div className="space-y-1.5">
            <Label className="text-xs">用户名</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="管理员"
              className="h-9"
            />
          </div>

          {/* 新密码 */}
          <div className="space-y-1.5">
            <Label className="text-xs">新密码 *（至少 6 位）</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••"
              className="h-9"
            />
          </div>

          {/* 确认新密码 */}
          <div className="space-y-1.5">
            <Label className="text-xs">确认新密码 *</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleChange()}
            />
          </div>

          <div className="text-[10px] text-muted-foreground">
            修改后将自动退出登录，请使用新邮箱和密码重新登录。
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleChange} disabled={loading} className="w-full gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            确认修改并重新登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
