'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, formatTime, formatWords } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import {
  Search,
  Download,
  History,
  Target,
  Loader2,
  FileText,
  BookOpen,
  RotateCcw,
  Save,
  Trash2,
  ChevronRight,
  Archive,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface Props {
  novelId: string
  novelTitle: string
  chapterId: string | null
  onJumpChapter?: (chapterId: string) => void
  onContentReload?: () => void
  wordGoal?: number
  totalWords?: number
}

// ============ 全文搜索 ============
function SearchTool({ novelId, onJumpChapter }: { novelId: string; onJumpChapter?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const r = await api<{ results: any[] }>(`/api/search?q=${encodeURIComponent(q)}&novelId=${novelId}`)
      setResults(r.results)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="全文搜索">
          <Search className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索章节正文..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <Button size="sm" onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {results.length === 0 && q && !loading && (
              <div className="text-xs text-muted-foreground text-center py-4">无匹配结果</div>
            )}
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  onJumpChapter?.(r.chapterId)
                  setOpen(false)
                }}
                className="w-full text-left p-2 hover:bg-muted rounded text-sm border border-transparent hover:border-violet-200"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium truncate">{r.chapterTitle}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{r.count} 处</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{r.preview}</p>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============ 导出 ============
function ExportTool({ novelId, novelTitle, chapterId }: { novelId: string; novelTitle: string; chapterId: string | null }) {
  const [open, setOpen] = useState(false)

  const handleExport = (scope: 'novel' | 'chapter' | 'zip', format: 'txt' | 'markdown') => {
    const params = new URLSearchParams()
    params.set('format', format)
    if (scope === 'novel') {
      params.set('novelId', novelId)
    } else if (scope === 'chapter') {
      if (!chapterId) {
        toast.error('请先选择章节')
        return
      }
      params.set('chapterId', chapterId)
    } else if (scope === 'zip') {
      params.set('novelId', novelId)
      const url = `/api/export/zip?${params.toString()}`
      const a = document.createElement('a')
      a.href = url
      a.download = `${novelTitle}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('已开始下载 ZIP 压缩包')
      setOpen(false)
      return
    }
    const url = `/api/export?${params.toString()}`
    const a = document.createElement('a')
    a.href = url
    a.download = `${scope === 'novel' ? novelTitle : 'chapter'}.${format === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('已导出')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="导出">
          <Download className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          {/* ZIP 导出（推荐） */}
          <div className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/20 border border-violet-200 dark:border-violet-900 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              <Archive className="w-3.5 h-3.5" />
              全书 ZIP 压缩包（推荐）
            </div>
            <p className="text-[10px] text-muted-foreground">
              按卷分文件夹，每章独立文件
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
                onClick={() => handleExport('zip', 'txt')}
              >
                <Archive className="w-3.5 h-3.5" /> ZIP-TXT
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
                onClick={() => handleExport('zip', 'markdown')}
              >
                <Archive className="w-3.5 h-3.5" /> ZIP-MD
              </Button>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">全书单文件</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('novel', 'txt')}>
                <FileText className="w-3.5 h-3.5" /> TXT
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('novel', 'markdown')}>
                <FileText className="w-3.5 h-3.5" /> Markdown
              </Button>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">当前章节导出</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!chapterId}
                onClick={() => handleExport('chapter', 'txt')}
              >
                <FileText className="w-3.5 h-3.5" /> TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!chapterId}
                onClick={() => handleExport('chapter', 'markdown')}
              >
                <FileText className="w-3.5 h-3.5" /> Markdown
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============ 版本历史 ============
function HistoryTool({ chapterId, onReload }: { chapterId: string | null; onReload?: () => void }) {
  const [open, setOpen] = useState(false)
  const [revisions, setRevisions] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  const load = useCallback(async () => {
    if (!chapterId) return
    setLoading(true)
    try {
      const r = await api<{ revisions: any[]; current: any }>(`/api/chapters/revisions?chapterId=${chapterId}`)
      setRevisions(r.revisions)
      setCurrent(r.current)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [chapterId])

  useEffect(() => {
    if (open && chapterId) load()
  }, [open, chapterId, load])

  const handleSnapshot = async () => {
    if (!chapterId) return
    try {
      const r = await api(`/api/chapters/revisions?chapterId=${chapterId}&reason=manual`, { method: 'POST' })
      toast.success(r.message)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleRollback = async (revisionId: string) => {
    if (!confirm('确认回滚到此版本？当前内容会被保存为新版本后再回滚。')) return
    try {
      const r = await api(`/api/chapters/revisions?revisionId=${revisionId}`, { method: 'PATCH' })
      toast.success(r.message)
      onReload?.()
      load()
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (revisionId: string) => {
    if (!confirm('删除此历史版本？')) return
    try {
      await api(`/api/chapters/revisions?revisionId=${revisionId}`, { method: 'DELETE' })
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="版本历史" disabled={!chapterId}>
          <History className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              版本历史
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSnapshot}>
              <Save className="w-3 h-3" />
              保存当前版本
            </Button>
          </div>
          {current && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
              当前版本：{current.words} 字 · {formatTime(current.updatedAt)}
            </div>
          )}
          <div className="max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : revisions.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                暂无历史版本<br/>
                <span className="text-[10px]">点击「保存当前版本」可手动创建快照</span>
              </div>
            ) : (
              revisions.map((r) => (
                <div key={r.id} className="group flex items-center gap-2 p-2 hover:bg-muted/50 rounded text-xs border border-transparent hover:border-violet-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-muted-foreground">
                      {r.words} 字 · {formatTime(r.createdAt)}
                      <Badge variant="outline" className="text-[9px] ml-1 px-1 py-0">
                        {r.reason === 'manual' ? '手动' : r.reason === 'pre-rollback' ? '回滚前' : r.reason}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreview(preview?.id === r.id ? null : r)}
                    className="opacity-50 hover:opacity-100 p-1"
                    title="预览"
                  >
                    <Search className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRollback(r.id)}
                    className="opacity-0 group-hover:opacity-100 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 p-1 rounded"
                    title="回滚到此版本"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded"
                    title="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
          {preview && (
            <div className="border-t pt-2">
              <div className="text-xs font-medium mb-1">预览：{preview.title}</div>
              <div className="max-h-32 overflow-y-auto text-xs bg-muted/30 rounded p-2 whitespace-pre-wrap">
                {preview.content.slice(0, 500)}{preview.content.length > 500 ? '...' : ''}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============ 字数目标 ============
function WordGoalTool({ novelId, wordGoal, totalWords }: { novelId: string; wordGoal: number; totalWords: number }) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(wordGoal || 0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGoal(wordGoal || 0)
  }, [wordGoal])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api('/api/novels', {
        method: 'PATCH',
        body: JSON.stringify({ id: novelId, wordGoal: Number(goal) || 0 }),
      })
      toast.success('字数目标已保存')
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const progress = goal > 0 ? Math.min(100, Math.round((totalWords / goal) * 100)) : 0
  const remaining = Math.max(0, goal - totalWords)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" title="字数目标">
          <Target className="w-3.5 h-3.5" />
          {goal > 0 ? (
            <span className="text-muted-foreground">{progress}%</span>
          ) : (
            <span className="text-muted-foreground">设目标</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            全书字数目标
          </div>
          {goal > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">进度</span>
                <span className="font-medium">{formatWords(totalWords)} / {formatWords(goal)} 字</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {remaining > 0 ? `还差 ${formatWords(remaining)} 字` : '🎉 已达成目标！'}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>设置目标字数（0 = 清除目标）</Label>
            <Input
              type="number"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              placeholder="如 500000"
            />
            <div className="flex gap-1">
              {[100000, 300000, 500000, 1000000].map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] flex-1"
                  onClick={() => setGoal(n)}
                >
                  {n / 10000}万
                </Button>
              ))}
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============ 主组件 ============
export function EditorToolbar({ novelId, novelTitle, chapterId, onJumpChapter, onContentReload, wordGoal, totalWords }: Props) {
  return (
    <>
      <SearchTool novelId={novelId} onJumpChapter={onJumpChapter} />
      <ExportTool novelId={novelId} novelTitle={novelTitle} chapterId={chapterId} />
      <HistoryTool chapterId={chapterId} onReload={onContentReload} />
      <WordGoalTool novelId={novelId} wordGoal={wordGoal || 0} totalWords={totalWords || 0} />
    </>
  )
}
