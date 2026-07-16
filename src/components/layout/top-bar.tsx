'use client'

import { useAppStore } from '@/lib/store'
import { BookOpen, LayoutGrid, Settings, User, Sparkles, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const { view, setView, backToWorkspace } = useAppStore()
  const [tokens, setTokens] = useState<number | null>(null)
  const [plan, setPlan] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const r = await api<{ user: { tokens: number; plan: string } }>('/api/user')
        if (mounted) {
          setTokens(r.user.tokens)
          setPlan(r.user.plan)
        }
      } catch {}
    }
    load()
    const i = setInterval(load, 15000)
    return () => {
      mounted = false
      clearInterval(i)
    }
  }, [view])

  const navs = [
    { id: 'workspace' as const, label: '工作台', icon: LayoutGrid },
    { id: 'settings' as const, label: '设定库', icon: Settings },
    { id: 'user' as const, label: '用户中心', icon: User },
  ]

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center px-4 gap-4 z-30 sticky top-0">
      <button
        onClick={backToWorkspace}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
          <PenLine className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-base hidden sm:block">墨灵写作</span>
      </button>

      <nav className="flex items-center gap-1 ml-4">
        {navs.map((n) => {
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
            </Button>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {tokens !== null && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">{tokens.toLocaleString()}</span>
            <span className="text-muted-foreground">Token</span>
          </Badge>
        )}
        {plan && plan !== 'free' && (
          <Badge variant="outline" className="text-violet-600 border-violet-300">
            {plan === 'pro' ? '月卡会员' : plan === 'year' ? '年卡会员' : plan}
          </Badge>
        )}
      </div>
    </header>
  )
}
