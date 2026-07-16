'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Wand2, Loader2, FileText, BookOpen, Users } from 'lucide-react'
import { api, GENRES } from '@/lib/helpers'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  folderId: string | null
  onCreated: (id: string) => void
}

export function NovelWizard({ open, onClose, folderId, onCreated }: Props) {
  const [tab, setTab] = useState<'manual' | 'ai'>('ai')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // 手动模式
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('玄幻')
  const [tags, setTags] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [outline, setOutline] = useState('')

  // AI 模式
  const [idea, setIdea] = useState('')
  const [aiGenre, setAiGenre] = useState('玄幻')
  const [aiResult, setAiResult] = useState<{
    synopsis?: string
    outline?: string
    characters?: string
    title?: string
  }>({})

  const handleAIGenerate = async () => {
    if (!idea.trim()) {
      toast.error('请输入一句话灵感')
      return
    }
    setLoading(true)
    setAiResult({})
    try {
      const r = await api<{ reply: string }>('/api/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'chat',
          preset: 'synopsis',
          message: `灵感：${idea}\n类型偏好：${aiGenre}\n请生成书籍简介、初步大纲和三个核心角色。`,
        }),
      })
      parseAIResult(r.reply)
      toast.success('AI 已生成内容')
    } catch (e: any) {
      toast.error(e.message || 'AI 生成失败')
    } finally {
      setLoading(false)
    }
  }

  const parseAIResult = (text: string) => {
    const result: any = {}
    // 提取 ## 简介 / ## 大纲 / ## 角色 等部分
    const sections = text.split(/^##\s+/m).filter(Boolean)
    for (const sec of sections) {
      const [header, ...body] = sec.split('\n')
      const h = header.trim().toLowerCase()
      const content = body.join('\n').trim()
      if (h.includes('简介') || h.includes('synopsis')) result.synopsis = content
      else if (h.includes('大纲') || h.includes('outline')) result.outline = content
      else if (h.includes('角色') || h.includes('character')) result.characters = content
      else if (h.includes('书名') || h.includes('title')) result.title = content.split('\n')[0].trim()
    }
    // 如果没解析到，整段当简介
    if (!result.synopsis && !result.outline) {
      result.synopsis = text
    }
    setAiResult(result)
  }

  const handleCreate = async () => {
    const finalTitle = tab === 'ai' ? (aiResult.title || idea.slice(0, 12)) : title
    if (!finalTitle?.trim()) {
      toast.error('请输入书名')
      return
    }
    setCreating(true)
    try {
      const body: any = {
        title: finalTitle,
        author,
        genre: tab === 'ai' ? aiGenre : genre,
        tags,
        synopsis: tab === 'ai' ? aiResult.synopsis : synopsis,
        outline: tab === 'ai' ? aiResult.outline : outline,
        folderId,
      }
      const r = await api<{ novel: { id: string } }>('/api/novels', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      toast.success('小说已创建')
      // 重置
      setTitle('')
      setIdea('')
      setSynopsis('')
      setOutline('')
      setAiResult({})
      onCreated(r.novel.id)
    } catch (e: any) {
      toast.error(e.message || '创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-violet-500" />
            创建新作品
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI 辅助建书
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              手动填写
            </TabsTrigger>
          </TabsList>

          {/* AI 模式 */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>一句话灵感 *</Label>
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="例：一个外卖小哥意外获得修仙系统，每送一单就能获得修为，但每差评就掉一个境界..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>类型偏好</Label>
              <Select value={aiGenre} onValueChange={setAiGenre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAIGenerate} disabled={loading} className="w-full gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'AI 奋力创作中...' : 'AI 生成简介+大纲+角色'}
            </Button>

            {aiResult.synopsis && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-violet-200 dark:border-violet-900">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> 书籍简介
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{aiResult.synopsis}</p>
                </div>
                {aiResult.outline && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> 初步大纲
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{aiResult.outline}</p>
                  </div>
                )}
                {aiResult.characters && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> 核心角色
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{aiResult.characters}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 手动模式 */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>书名 *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入书名" />
              </div>
              <div className="space-y-2">
                <Label>笔名</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="留空使用默认笔名" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>标签（逗号分隔）</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：爽文,热血,反派" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>简介</Label>
              <Textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="一句话吸引读者..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>大纲</Label>
              <Textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="核心剧情走向..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            创建并进入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
