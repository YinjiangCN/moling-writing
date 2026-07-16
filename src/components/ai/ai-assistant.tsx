'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Send,
  Sparkles,
  Loader2,
  Wand2,
  BookMarked,
  Trash2,
  Bot,
  User as UserIcon,
  Lightbulb,
} from 'lucide-react'
import { api } from '@/lib/helpers'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Preset {
  id: string
  name: string
  category: string
  description: string
  system: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  preset?: string
}

interface Props {
  novelId: string
  chapterId: string | null
  onInsertText: (text: string) => void
}

export function AiAssistant({ novelId, chapterId, onInsertText }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetOpen, setPresetOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api<{ presets: Preset[] }>('/api/ai')
      .then((r) => setPresets(r.presets))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = async (content: string, preset?: string) => {
    if (!content.trim() || loading) return
    const userMsg: Message = { role: 'user', content, preset }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // 先创建一个空的 assistant 消息，用于流式追加
    const assistantId = Date.now()
    setMessages((prev) => [...prev, { role: 'assistant', content: '', preset }])

    try {
      // 使用流式 API
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'chat',
          preset: preset || undefined,
          message: content,
          novelId,
          chapterId,
        }),
      })

      if (res.status === 401) {
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: '登录已过期，请重新登录后继续使用 AI。' }
          return copy
        })
        return
      }
      if (res.status === 402) {
        const err = await res.json().catch(() => ({}))
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: err.error || 'Token 余额不足，请前往用户中心充值。' }
          return copy
        })
        return
      }
      if (!res.ok || !res.body) {
        throw new Error('AI 调用失败')
      }

      // 读取 SSE 流
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // 按行处理
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data) continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.delta) {
                fullContent += parsed.delta
                // 更新最后一条消息
                setMessages((prev) => {
                  const copy = [...prev]
                  copy[copy.length - 1] = { role: 'assistant', content: fullContent, preset }
                  return copy
                })
              }
              if (parsed.error) {
                setMessages((prev) => {
                  const copy = [...prev]
                  copy[copy.length - 1] = { role: 'assistant', content: `出错了：${parsed.error}` }
                  return copy
                })
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
          copy[copy.length - 1] = { role: 'assistant', content: `抱歉，出错了：${e.message}` }
        } else {
          copy.push({ role: 'assistant', content: `抱歉，出错了：${e.message}` })
        }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    sendMessage(input)
  }

  const handlePreset = (p: Preset) => {
    setPresetOpen(false)
    if (p.id === 'poison_check' || p.id === 'break_block') {
      // 这类需要先有正文
      sendMessage(`请基于当前章节内容，执行「${p.name}」任务。`, p.id)
    } else if (p.id === 'name_gen') {
      sendMessage('请生成 10 个有特色的招式名，附带风格说明。', p.id)
    } else if (p.id === 'golden_three') {
      sendMessage('请基于当前小说设定，生成抓人的前三章。', p.id)
    } else if (p.id === 'char_dialogue') {
      sendMessage('请模拟当前小说中两个核心角色的对话，5-8 轮。', p.id)
    } else {
      // 让用户输入内容
      const content = prompt(`使用「${p.name}」预设，请输入内容：`, '')
      if (content) sendMessage(content, p.id)
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  // 按类别分组预设
  const grouped = presets.reduce<Record<string, Preset[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  return (
    <div className="h-full flex flex-col bg-card/30">
      {/* 顶部 */}
      <div className="h-10 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Bot className="w-4 h-4 text-violet-500" />
        <span className="font-medium text-sm">AI 助手</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          长文本记忆
        </Badge>
        <Popover open={presetOpen} onOpenChange={setPresetOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" title="预设指令库">
              <BookMarked className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                预设指令库
              </div>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="text-xs text-muted-foreground mb-1">{cat}</div>
                  <div className="space-y-1">
                    {items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePreset(p)}
                        className="w-full text-left px-2 py-1.5 hover:bg-muted rounded text-sm flex flex-col"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear} title="清空">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* 对话区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-3">
              <Wand2 className="w-6 h-6 text-violet-500" />
            </div>
            <p className="text-sm font-medium mb-1">AI 助手已就绪</p>
            <p className="text-xs text-muted-foreground mb-4">
              已自动注入世界观、大纲、前情提要
            </p>
            <div className="space-y-1.5 w-full">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> 试试：
              </p>
              {[
                '帮我把这一章的结尾改得更有悬念',
                '帮我想一个反派的名字和背景',
                '当前剧情有点平淡，给我点灵感',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs px-3 py-2 bg-muted/50 hover:bg-muted rounded border border-violet-100 dark:border-violet-900"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                m.role === 'user'
                  ? 'bg-emerald-500/20'
                  : 'bg-gradient-to-br from-violet-500/20 to-pink-500/20'
              }`}
            >
              {m.role === 'user' ? (
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-violet-600" />
              )}
            </div>
            <div className={`flex-1 max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
              {m.preset && (
                <Badge variant="outline" className="text-[10px] mb-1 px-1 py-0">
                  {presets.find((p) => p.id === m.preset)?.name || m.preset}
                </Badge>
              )}
              <div
                className={`inline-block text-sm px-3 py-2 rounded-lg whitespace-pre-wrap text-left ${
                  m.role === 'user'
                    ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                    : 'bg-muted'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'assistant' && (
                <div className="mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={() => {
                      onInsertText(m.content)
                    }}
                  >
                    <Send className="w-3 h-3" />
                    插入到正文
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-sm text-muted-foreground">思考中...</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问 AI 任何创作问题... (Shift+Enter 换行)"
            rows={2}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
          @ 触发设定调用 · AI 已加载当前小说上下文
        </div>
      </div>
    </div>
  )
}
