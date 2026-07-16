'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { WorkspaceView } from '@/components/workspace/workspace-view'
import { EditorView } from '@/components/editor/editor-view'
import { SettingsLibrary } from '@/components/settings/settings-library'
import { UserCenter } from '@/components/user/user-center'
import { TopBar } from '@/components/layout/top-bar'

export default function Home() {
  const { view, theme, currentNovelId } = useAppStore()
  // 用 useState 初始化 mounted=true，避免 effect 中 setState 警告
  const [mounted] = useState(true)

  useEffect(() => {
    // 应用主题（仅操作 DOM，无 setState）
    const root = document.documentElement
    root.classList.remove('dark', 'theme-eye')
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'eye') root.classList.add('theme-eye')
  }, [theme])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar />
      <main className="flex-1 flex overflow-hidden">
        {view === 'workspace' && <WorkspaceView />}
        {view === 'editor' && currentNovelId && <EditorView />}
        {view === 'settings' && <SettingsLibrary />}
        {view === 'user' && <UserCenter />}
      </main>
    </div>
  )
}
