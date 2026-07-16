'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  BookOpen,
  FileText,
  MoreVertical,
  Trash2,
  Pencil,
  ListTree,
} from 'lucide-react'
import { api, CHAPTER_STATUS, formatWords, countWords } from '@/lib/helpers'
import type { NovelDetail, Volume, Chapter } from './editor-view'
import { toast } from 'sonner'

interface Props {
  novel: NovelDetail
  currentChapterId: string | null
  onSelect: (id: string) => void
  onChange: () => void
}

export function ChapterTree({ novel, currentChapterId, onSelect, onChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(novel.volumes.map((v) => v.id))
  )
  const [addDialog, setAddDialog] = useState<{ type: 'volume' | 'chapter'; volumeId?: string } | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isOutline, setIsOutline] = useState(false)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error('请输入标题')
      return
    }
    try {
      if (addDialog?.type === 'volume') {
        await api('/api/chapters', {
          method: 'POST',
          body: JSON.stringify({
            type: 'volume',
            title: newTitle,
            novelId: novel.id,
            isOutline,
          }),
        })
      } else if (addDialog?.volumeId) {
        await api('/api/chapters', {
          method: 'POST',
          body: JSON.stringify({
            type: 'chapter',
            title: newTitle,
            volumeId: addDialog.volumeId,
            novelId: novel.id,
          }),
        })
      }
      toast.success('已创建')
      setNewTitle('')
      setIsOutline(false)
      setAddDialog(null)
      onChange()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string, type: 'volume' | 'chapter') => {
    if (!confirm(type === 'volume' ? '删除整卷会删除其下所有章节，确认？' : '确认删除该章节？')) return
    try {
      await api(`/api/chapters?id=${id}&type=${type}`, { method: 'DELETE' })
      toast.success('已删除')
      onChange()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleRename = async (item: Volume | Chapter, type: 'volume' | 'chapter') => {
    const title = prompt('新标题', item.title)
    if (!title || title === item.title) return
    try {
      if (type === 'volume') {
        await api('/api/chapters', {
          method: 'PATCH',
          body: JSON.stringify({ id: item.id, title }),
        })
      } else {
        await api('/api/chapters', {
          method: 'PATCH',
          body: JSON.stringify({ id: item.id, title }),
        })
      }
      onChange()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const totalWords = novel.volumes.reduce(
    (s, v) => s + v.chapters.reduce((s2, c) => s2 + c.words, 0),
    0
  )

  return (
    <div className="h-full flex flex-col bg-card/30">
      {/* 顶部 */}
      <div className="h-10 border-b border-border flex items-center px-3 gap-2">
        <ListTree className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">章节目录</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {formatWords(totalWords)} 字
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAddDialog({ type: 'volume' })}>
              <BookOpen className="w-3.5 h-3.5 mr-2" />
              新建卷
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddDialog({ type: 'volume' })}>
              <ListTree className="w-3.5 h-3.5 mr-2" />
              新建大纲卷
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 树 */}
      <div className="flex-1 overflow-y-auto py-2 text-sm">
        {novel.volumes.map((vol) => (
          <div key={vol.id}>
            <div
              className="group flex items-center px-2 hover:bg-muted/50 cursor-pointer"
              onClick={() => toggle(vol.id)}
            >
              {expanded.has(vol.id) ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-violet-500 shrink-0" />
              <span className="truncate flex-1 font-medium">{vol.title}</span>
              {vol.isOutline && (
                <Badge variant="outline" className="text-[10px] mr-1 px-1 py-0">
                  大纲
                </Badge>
              )}
              <span className="text-xs text-muted-foreground mr-1">
                {vol.chapters.length}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddDialog({ type: 'chapter', volumeId: vol.id })}>
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    新建章节
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRename(vol, 'volume')}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(vol.id, 'volume')}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    删除卷
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded.has(vol.id) && (
              <div className="ml-4">
                {vol.chapters.map((c) => {
                  const status = CHAPTER_STATUS[c.status] || CHAPTER_STATUS.draft
                  const active = c.id === currentChapterId
                  return (
                    <div
                      key={c.id}
                      className={`group flex items-center pl-4 pr-2 py-1.5 cursor-pointer rounded-sm mx-1 transition ${
                        active
                          ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onSelect(c.id)}
                    >
                      <FileText className={`w-3 h-3 mr-1.5 shrink-0 ${active ? 'text-violet-500' : 'text-muted-foreground'}`} />
                      <span className="truncate flex-1 text-[13px]">{c.title}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1 shrink-0`} />
                      <span className="text-[10px] text-muted-foreground mr-1">
                        {c.words > 0 ? formatWords(c.words) : ''}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRename(c, 'chapter')}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            重命名
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(c.id, 'chapter')}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
                {vol.chapters.length === 0 && (
                  <div className="text-xs text-muted-foreground px-4 py-2 italic">
                    暂无章节
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 新建对话框 */}
      <Dialog open={!!addDialog} onOpenChange={(v) => !v && setAddDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addDialog?.type === 'volume' ? '新建卷' : '新建章节'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>{addDialog?.type === 'volume' ? '卷名' : '章节标题'}</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={addDialog?.type === 'volume' ? '如：第二卷 风起云涌' : '如：第三章 初遇'}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            {addDialog?.type === 'volume' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOutline"
                  checked={isOutline}
                  onChange={(e) => setIsOutline(e.target.checked)}
                />
                <Label htmlFor="isOutline" className="cursor-pointer">
                  作为大纲卷（仅写大纲，不写正文）
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(null)}>
              取消
            </Button>
            <Button onClick={handleAdd}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
