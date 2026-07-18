'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { WorkspaceView } from '@/components/workspace/workspace-view'
import { EditorView } from '@/components/editor/editor-view'
import { SettingsLibrary } from '@/components/settings/settings-library'
import { UserCenter } from '@/components/user/user-center'
import { TopBar } from '@/components/layout/top-bar'
import { AuthView } from '@/components/auth/auth-view'
import { AdminView } from '@/components/admin/admin-view'
import { AutoSerialPanel } from '@/components/editor/auto-serial-panel'
import { PlazaView } from '@/components/plaza/plaza-view'
import { ForceChangePasswordDialog } from '@/components/auth/force-change-password'

export default function Home() {
  const { view, theme, currentNovelId, user, authLoading, forceChangePassword } = useAppStore()
  const [mounted] = useState(true)

  useEffect(() => {
    // 应用主题
    const root = document.documentElement
    root.classList.remove('dark', 'theme-eye')
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'eye') root.classList.add('theme-eye')
  }, [theme])

  if (!mounted) return null

  // 鉴权加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">加载中...</div>
        </main>
      </div>
    )
  }

  // 未登录 - 显示登录/注册页
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <TopBar />
        <main className="flex-1 flex overflow-hidden">
          <AuthView />
        </main>
      </div>
    )
  }

  // 已登录
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar />
      <main className="flex-1 flex overflow-hidden">
        {view === 'workspace' && <WorkspaceView />}
        {view === 'plaza' && <PlazaView />}
        {view === 'editor' && currentNovelId && <EditorView />}
        {view === 'settings' && <SettingsLibrary />}
        {view === 'user' && <UserCenter />}
        {view === 'admin' && user.role === 'admin' && <AdminView />}
        {view === 'admin' && user.role !== 'admin' && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            无权访问管理后台
          </div>
        )}
      </main>

      {/* 强制修改密码弹窗 */}
      <ForceChangePasswordDialog
        open={forceChangePassword}
        onClose={() => {}}
      />
    </div>
  )
}
