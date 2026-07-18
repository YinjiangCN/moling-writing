'use client'

import { useAppStore } from '@/lib/store'
import { LayoutGrid, Settings, User, Sparkles, PenLine, Shield, LogOut, Loader2, Bell, Megaphone, BookOpen } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { MessagesDialog } from '@/components/user/messages-dialog'
import { LanguageSwitcher } from './language-switcher'
import { useI18n } from '@/lib/i18n/store'
import { api } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface UserPublic {
  id: string
  email: string
  name: string | null
  penName: string | null
  avatar: string | null
  tokens: number
  plan: string
  role: string
  banned: boolean
  createdAt: string
}

export function TopBar() {
  const { user, setUser, authLoading, view, setView, backToWorkspace, setForceChangePassword } = useAppStore()
  const { t } = useI18n()
  const [tokens, setTokens] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [messagesOpen, setMessagesOpen] = useState(false)

  // 拉取未读数（供 MessagesDialog 通过 onUnreadChange 回调更新）
  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      const [msgR, annR] = await Promise.all([
        api<{ unreadCount: number }>('/api/messages').catch(() => ({ unreadCount: 0 })),
        api<{ unreadCount: number }>('/api/announcements').catch(() => ({ unreadCount: 0 })),
      ])
      setUnreadCount((msgR.unreadCount || 0) + (annR.unreadCount || 0))
    } catch {}
  }, [user])

  // 启动时拉取当前用户
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const r = await api<{ user: UserPublic | null; needChangePassword?: boolean }>('/api/auth/me')
        if (mounted) {
          setUser(r.user)
          if (r.user) {
            setTokens(r.user.tokens)
            // 根据后端返回设置/清除强制改密码状态
            setForceChangePassword(!!r.needChangePassword)
          } else {
            setForceChangePassword(false)
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) useAppStore.setState({ authLoading: false })
      }
    }
    load()
  }, [setUser])

  // 拉取最新 token + 未读消息数
  useEffect(() => {
    if (!user) return
    let mounted = true
    const load = async () => {
      try {
        const userR = await api<{ user: { tokens: number } }>('/api/user')
        if (mounted) setTokens(userR.user.tokens)
        await fetchUnread()
      } catch {}
    }
    load()
    const i = setInterval(load, 30000)
    return () => {
      mounted = false
      clearInterval(i)
    }
  }, [user, view, fetchUnread])

  // 关闭弹窗后刷新未读数
  const handleMessagesOpenChange = (open: boolean) => {
    setMessagesOpen(open)
    if (!open) fetchUnread()
  }

  const handleLogout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setTokens(null)
      setView('login')
      toast.success('已退出登录')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const navs: { id: 'workspace' | 'plaza' | 'settings' | 'user' | 'admin'; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'workspace' as const, label: t('nav.workspace'), icon: LayoutGrid },
    { id: 'plaza' as const, label: t('nav.plaza'), icon: BookOpen },
    { id: 'settings' as const, label: t('nav.settings'), icon: Settings },
    { id: 'user' as const, label: t('nav.user'), icon: User },
    { id: 'admin' as const, label: t('nav.admin'), icon: Shield, adminOnly: true },
  ]

  // 鉴权加载中
  if (authLoading) {
    return (
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center px-4 z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <PenLine className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">墨灵写作</span>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
      </header>
    )
  }

  // 未登录
  if (!user) {
    return (
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center px-4 z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <PenLine className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">墨灵写作</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Button onClick={() => setView('login')} size="sm" className="gap-1.5">
            <PenLine className="w-3.5 h-3.5" />
            登录 / 注册
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center px-4 gap-4 z-30 sticky top-0">
      <button onClick={backToWorkspace} className="flex items-center gap-2 hover:opacity-80 transition">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
          <PenLine className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-base hidden sm:block">墨灵写作</span>
      </button>

      <nav className="flex items-center gap-1 ml-4">
        {navs
          .filter((n) => !n.adminOnly || user.role === 'admin')
          .map((n) => {
            const Icon = n.icon
            const active = view === n.id || (n.id === 'workspace' && view === 'editor')
            return (
              <Button
                key={n.id}
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView(n.id)}
                className="gap-1.5"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{n.label}</span>
                {n.adminOnly && <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">ADMIN</Badge>}
              </Button>
            )
          })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* 语言切换 */}
        <LanguageSwitcher />

        {/* 消息铃铛 - 点击直接弹出弹窗 */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={() => setMessagesOpen(true)}
          title="平台消息与公告"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {tokens !== null && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 cursor-pointer" onClick={() => setView('user')}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">{tokens.toLocaleString()}</span>
            <span className="text-muted-foreground hidden sm:inline">Token</span>
          </Badge>
        )}
        {user.plan !== 'free' && (
          <Badge variant="outline" className="text-violet-600 border-violet-300 hidden sm:inline-flex">
            {user.plan === 'pro' ? '月卡' : user.plan === 'year' ? '年卡' : user.plan}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xs">
                  {(user.penName || user.name || user.email)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user.penName || user.name || '未命名'}</span>
                <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setView('user')}>
              <User className="w-3.5 h-3.5 mr-2" />
              用户中心
            </DropdownMenuItem>
            {user.role === 'admin' && (
              <DropdownMenuItem onClick={() => setView('admin')}>
                <Shield className="w-3.5 h-3.5 mr-2" />
                管理后台
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 消息中心弹窗 */}
      <MessagesDialog
        open={messagesOpen}
        onOpenChange={handleMessagesOpenChange}
        onUnreadChange={setUnreadCount}
      />
    </header>
  )
}
