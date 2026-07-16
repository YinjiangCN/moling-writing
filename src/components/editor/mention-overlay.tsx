'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/helpers'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users, Map, Sword, Loader2 } from 'lucide-react'

interface SettingItem {
  id: string
  name: string
  type: string
  // 角色字段
  personality?: string
  background?: string
  abilities?: string
  // 世界观字段
  description?: string
  // 道具字段
  effect?: string
  attributes?: string
}

interface Props {
  novelId: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  content: string
  onInsert: (text: string) => void
}

// @ 设定引用组件
// 监听 textarea 中输入 @，弹出设定搜索 Popover
export function MentionOverlay({ novelId, textareaRef, content, onInsert }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const lastContentRef = useRef('')

  // 加载设定
  const loadSettings = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const [charR, worldR, itemR] = await Promise.all([
        api<{ items: SettingItem[] }>(`/api/characters?type=character&novelId=${novelId}`).catch(() => ({ items: [] })),
        api<{ items: SettingItem[] }>(`/api/characters?type=worldview&novelId=${novelId}`).catch(() => ({ items: [] })),
        api<{ items: SettingItem[] }>(`/api/characters?type=item&novelId=${novelId}`).catch(() => ({ items: [] })),
      ])
      const all = [
        ...charR.items.map((c) => ({ ...c, type: 'character' })),
        ...worldR.items.map((w) => ({ ...w, type: 'worldview' })),
        ...itemR.items.map((i) => ({ ...i, type: 'item' })),
      ]
      const filtered = q
        ? all.filter((s) => s.name.includes(q))
        : all
      setItems(filtered.slice(0, 10))
    } catch {}
    finally { setLoading(false) }
  }, [novelId])

  // 监听内容变化，检测 @ 输入
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return

    // 只在内容变化时检查
    if (content === lastContentRef.current) return
    lastContentRef.current = content

    const cursorPos = ta.selectionStart
    // 查找光标前最近的 @
    const beforeCursor = content.slice(0, cursorPos)
    const atMatch = beforeCursor.match(/@([^\s@]*)$/)
    
    if (atMatch) {
      const query = atMatch[1]
      const atPos = cursorPos - query.length - 1 // @ 的位置
      
      // 计算光标在屏幕上的位置（粗略估算）
      const lines = beforeCursor.split('\n')
      const lineHeight = 28
      const top = lines.length * lineHeight + 40 // 大概位置
      const left = (lines[lines.length - 1]?.length || 0) * 16 + 60

      setPosition({ top: Math.min(top, window.innerHeight - 300), left: Math.min(left, window.innerWidth - 350) })
      setMentionStart(atPos)
      setSearch(query)
      setOpen(true)
      loadSettings(query)
    } else {
      setOpen(false)
      setMentionStart(null)
    }
  }, [content, textareaRef, loadSettings])

  // 选中某个设定
  const handleSelect = (item: SettingItem) => {
    if (mentionStart === null) return
    const ta = textareaRef.current
    if (!ta) return

    const cursorPos = ta.selectionStart
    // 替换 @xxx 为设定名称
    const before = content.slice(0, mentionStart)
    const after = content.slice(cursorPos)
    const insertText = `【${item.name}】`
    const newContent = before + insertText + after
    onInsert(newContent)
    
    // 也会将该设定作为背景注入 AI 上下文（通过 onInsert 后触发保存）
    setOpen(false)
    setMentionStart(null)
    
    // 调整光标位置
    setTimeout(() => {
      if (ta) {
        const newPos = before.length + insertText.length
        ta.focus()
        ta.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    character: { label: '角色', icon: Users, color: 'text-violet-500' },
    worldview: { label: '世界观', icon: Map, color: 'text-emerald-500' },
    item: { label: '道具', icon: Sword, color: 'text-amber-500' },
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="absolute pointer-events-none"
          style={{ top: position.top, left: position.left, width: 0, height: 0 }}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 border-b">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              // 同时更新 textarea 中的 @xxx
              if (mentionStart !== null && textareaRef.current) {
                const ta = textareaRef.current
                const cursorPos = ta.selectionStart
                const before = content.slice(0, mentionStart)
                const after = content.slice(cursorPos)
                const newContent = before + '@' + e.target.value + after
                onInsert(newContent)
                setTimeout(() => {
                  ta.setSelectionRange(mentionStart + 1 + e.target.value.length, mentionStart + 1 + e.target.value.length)
                }, 0)
              }
              loadSettings(e.target.value)
            }}
            placeholder="搜索设定..."
            autoFocus
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              {search ? '无匹配设定' : '在设定库创建角色/世界观/道具后可在此引用'}
            </div>
          ) : (
            items.map((item) => {
              const tc = typeConfig[item.type] || typeConfig.character
              const Icon = tc.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition text-sm border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${tc.color}`} />
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className={`text-[9px] ml-auto ${tc.color}`}>
                      {tc.label}
                    </Badge>
                  </div>
                  {(item.personality || item.description || item.effect) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.personality || item.description || item.effect}
                    </p>
                  )}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
