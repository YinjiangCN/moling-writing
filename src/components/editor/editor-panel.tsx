'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Heading,
  Quote,
  List,
  Sparkles,
  Wand2,
  Loader2,
  FileText,
  Eye,
  Type,
} from 'lucide-react'
import { api, CHAPTER_STATUS } from '@/lib/helpers'
import type { Chapter, NovelDetail } from './editor-view'
import { toast } from 'sonner'
import { MentionOverlay } from './mention-overlay'
import { RichTextEditor } from './rich-text-editor'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface Props {
  chapter: Chapter | null
  novel: NovelDetail
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onStatusChange: (status: string) => void
  editorMode: 'normal' | 'focus' | 'typewriter'
  onInsertText: (text: string) => void
}

export function EditorPanel({
  chapter,
  novel,
  onContentChange,
  onTitleChange,
  onStatusChange,
  editorMode,
  onInsertText,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedText, setSelectedText] = useState('')
  const [selectionPos, setSelectionPos] = useState<{ start: number; end: number } | null>(null)
  const [inlineMenuOpen, setInlineMenuOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [genChapterOpen, setGenChapterOpen] = useState(false)
  const [useRichText, setUseRichText] = useState(false)
  const [coreEvent, setCoreEvent] = useState('')

  // 监听选中
  const handleSelect = () => {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart, selectionEnd } = ta
    if (selectionEnd > selectionStart) {
      const text = ta.value.substring(selectionStart, selectionEnd)
      setSelectedText(text)
      setSelectionPos({ start: selectionStart, end: selectionEnd })
      setInlineMenuOpen(true)
    } else {
      setSelectedText('')
      setInlineMenuOpen(false)
    }
  }

  // 内联 AI 操作
  const handleInlineAI = async (preset: string, targetStyle?: string) => {
    if (!selectedText) return
    setAiLoading(true)
    setInlineMenuOpen(false)
    try {
      const r = await api<{ reply: string }>('/api/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'edit',
          preset,
          message: selectedText,
          targetStyle,
          novelId: novel.id,
          chapterId: chapter?.id,
        }),
      })
      // 替换选中文本
      if (selectionPos && textareaRef.current) {
        const before = chapter?.content.substring(0, selectionPos.start) || ''
        const after = chapter?.content.substring(selectionPos.end) || ''
        const newContent = before + r.reply + after
        onContentChange(newContent)
        toast.success('已应用 AI 修改')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  // 一键生成整章
  const handleGenerateChapter = async () => {
    if (!coreEvent.trim() || !chapter) {
      toast.error('请填写核心事件')
      return
    }
    setAiLoading(true)
    try {
      const r = await api<{ reply: string }>('/api/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'chat',
          preset: 'chapter_gen',
          message: `请根据以下核心事件生成完整章节：${coreEvent}`,
          novelId: novel.id,
          chapterId: chapter.id,
        }),
      })
      onContentChange(r.reply)
      // 同时更新章节摘要
      try {
        await api('/api/chapters', {
          method: 'PATCH',
          body: JSON.stringify({ id: chapter.id, summary: coreEvent }),
        })
      } catch {}
      toast.success('AI 已生成完整章节')
      setGenChapterOpen(false)
      setCoreEvent('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  // 插入 markdown 符号
  const insertMarkdown = (prefix: string, suffix = '') => {
    const ta = textareaRef.current
    if (!ta || !chapter) return
    const { selectionStart, selectionEnd } = ta
    const before = chapter.content.substring(0, selectionStart)
    const selected = chapter.content.substring(selectionStart, selectionEnd)
    const after = chapter.content.substring(selectionEnd)
    const newContent = before + prefix + selected + suffix + after
    onContentChange(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length)
    }, 0)
  }

  // 打字机模式：滚动使当前行居中
  const handleScroll = () => {
    if (editorMode !== 'typewriter' || !textareaRef.current) return
    const ta = textareaRef.current
    const lineHeight = 28
    const caretPos = ta.selectionStart
    const textBefore = ta.value.substring(0, caretPos)
    const lines = textBefore.split('\n').length
    const targetScroll = lines * lineHeight - ta.clientHeight / 2 + lineHeight / 2
    ta.scrollTop = Math.max(0, targetScroll)
  }

  if (!chapter) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <FileText className="w-12 h-12 mb-3 opacity-40" />
        <p>从左侧选择一个章节开始创作</p>
        <p className="text-xs mt-1">或新建一个章节</p>
      </div>
    )
  }

  const status = CHAPTER_STATUS[chapter.status] || CHAPTER_STATUS.draft

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* 顶部章节信息 */}
      <div className="h-14 border-b border-border flex items-center px-6 gap-3 shrink-0">
        <Input
          value={chapter.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="border-0 px-0 h-auto text-lg font-semibold focus-visible:ring-0 bg-transparent"
          placeholder="章节标题"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(CHAPTER_STATUS).map(([k, v]) => (
              <DropdownMenuItem key={k} onClick={() => onStatusChange(k)}>
                <span className={`w-1.5 h-1.5 rounded-full ${v.dot} mr-2`} />
                {v.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={genChapterOpen} onOpenChange={setGenChapterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 shrink-0 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              一键生成
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">核心事件 *</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI 会根据核心事件 + 小说上下文自动生成完整章节
                </p>
              </div>
              <Textarea
                value={coreEvent}
                onChange={(e) => setCoreEvent(e.target.value)}
                placeholder="例：主角在森林中遭遇追杀，觉醒血脉力量反杀敌人，但被神秘少女目睹"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setGenChapterOpen(false)}>
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerateChapter}
                  disabled={aiLoading}
                  className="gap-1.5"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  生成
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 工具栏 */}
      <div className="h-9 border-b border-border bg-muted/20 flex items-center px-4 gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('**', '**')}>
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('*', '*')}>
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('## ')}>
          <Heading className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('> ')}>
          <Quote className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertMarkdown('- ')}>
          <List className="w-3.5 h-3.5" />
        </Button>
        {/* 纯文本/富文本切换 */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs gap-1 ml-1 ${useRichText ? 'bg-secondary' : ''}`}
          onClick={() => setUseRichText(!useRichText)}
          title={useRichText ? '切换到纯文本模式' : '切换到富文本模式'}
        >
          <Type className="w-3.5 h-3.5" />
          {useRichText ? '纯文本' : '富文本'}
        </Button>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {aiLoading ? (
            <span className="text-violet-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI 处理中...
            </span>
          ) : (
            <>
              <span>{chapter.words} 字</span>
              {chapter.words > 0 && (
                <span className="text-muted-foreground/70">
                  约 {Math.ceil(chapter.words / 400)} 分钟阅读
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 编辑区 */}
      <div className="flex-1 overflow-hidden relative">
        {useRichText ? (
          /* 富文本编辑器模式 */
          <RichTextEditor
            value={chapter.content}
            onChange={onContentChange}
            placeholder="开始你的创作...（富文本模式，支持工具栏排版）"
            editorMode={editorMode}
            onSelectionChange={(text) => {
              setSelectedText(text)
              setInlineMenuOpen(!!text)
            }}
          />
        ) : (
          /* 纯文本编辑器模式（原有） */
          <textarea
            ref={textareaRef}
            value={chapter.content}
            onChange={(e) => onContentChange(e.target.value)}
            onSelect={handleSelect}
            onScroll={handleScroll}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                insertMarkdown('**', '**')
              } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault()
                insertMarkdown('*', '*')
              } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                toast.success('已保存')
              }
            }}
            placeholder="开始你的创作... 选中文字可触发 AI 润色/扩写/缩写菜单（Ctrl+B 粗体 / Ctrl+I 斜体 / 输入 @ 引用设定）"
            className={`w-full h-full resize-none bg-background px-12 py-8 outline-none text-base leading-7 ${
              editorMode === 'focus' ? 'focus-within:[&::-webkit-scrollbar]:w-0' : ''
            } ${editorMode === 'typewriter' ? 'typewriter-mode' : ''}`}
            style={{
              fontFamily: '"Noto Serif SC", "Source Han Serif", Georgia, serif',
              fontSize: '16px',
              lineHeight: '28px',
            }}
          />
        )}

        {/* @ 设定引用 */}
        {chapter && (
          <MentionOverlay
            novelId={novel.id}
            textareaRef={textareaRef}
            content={chapter.content}
            onInsert={(text) => onContentChange(text)}
          />
        )}

        {/* 内联 AI 悬浮菜单 */}
        {selectedText && inlineMenuOpen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <Popover open={inlineMenuOpen} onOpenChange={setInlineMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 shadow-lg border-violet-200"
                  onClick={(e) => e.preventDefault()}
                >
                  {aiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  )}
                  AI 处理选中文字
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="center">
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <button
                    onClick={() => handleInlineAI('polish')}
                    className="px-3 py-2 hover:bg-muted rounded text-left"
                  >
                    润色
                  </button>
                  <button
                    onClick={() => handleInlineAI('expand')}
                    className="px-3 py-2 hover:bg-muted rounded text-left"
                  >
                    扩写
                  </button>
                  <button
                    onClick={() => handleInlineAI('shorten')}
                    className="px-3 py-2 hover:bg-muted rounded text-left"
                  >
                    缩写
                  </button>
                  <button
                    onClick={() => handleInlineAI('continue')}
                    className="px-3 py-2 hover:bg-muted rounded text-left"
                  >
                    续写
                  </button>
                  <button
                    onClick={() => handleInlineAI('style_change', '古风')}
                    className="px-3 py-2 hover:bg-muted rounded text-left col-span-2"
                  >
                    转古风文风
                  </button>
                  <button
                    onClick={() => handleInlineAI('style_change', '科幻')}
                    className="px-3 py-2 hover:bg-muted rounded text-left col-span-2"
                  >
                    转科幻文风
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  )
}
