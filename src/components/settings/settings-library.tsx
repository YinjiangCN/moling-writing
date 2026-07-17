/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Map,
  Sword,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  Network,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'

type CardType = 'character' | 'worldview' | 'item'

interface SettingCard {
  id: string
  name: string
  // character
  avatar?: string
  appearance?: string
  personality?: string
  background?: string
  abilities?: string
  relations?: string
  // worldview
  type?: string
  description?: string
  // item
  attributes?: string
  effect?: string
  novelId?: string | null
}

const TYPE_LABELS: Record<CardType, { label: string; icon: any; color: string }> = {
  character: { label: '角色卡', icon: Users, color: 'text-violet-500' },
  worldview: { label: '世界观', icon: Map, color: 'text-emerald-500' },
  item: { label: '道具/功法', icon: Sword, color: 'text-amber-500' },
}

export function SettingsLibrary() {
  const [type, setType] = useState<CardType>('character')
  const [cards, setCards] = useState<SettingCard[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<SettingCard | null>(null)
  const [open, setOpen] = useState(false)
  const [aiGenOpen, setAiGenOpen] = useState(false)
  const [aiGenLoading, setAiGenLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ items: SettingCard[] }>(`/api/characters?type=${type}`)
      setCards(r.items)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (data: Partial<SettingCard>) => {
    try {
      if (editing?.id) {
        await api('/api/characters', {
          method: 'PATCH',
          body: JSON.stringify({ id: editing.id, type, ...data }),
        })
        toast.success('已更新')
      } else {
        await api('/api/characters', {
          method: 'POST',
          body: JSON.stringify({ type, ...data }),
        })
        toast.success('已创建')
      }
      setOpen(false)
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该设定卡？')) return
    try {
      await api(`/api/characters?id=${id}&type=${type}`, { method: 'DELETE' })
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleAIGenerate = async (card: SettingCard) => {
    if (type === 'character') {
      const name = card.name
      const brief = prompt(`请输入 ${name} 的几个关键词（如：性格、背景要点）`, '冷漠，孤儿，剑修')
      if (!brief) return
      toast.info('AI 生成中...')
      try {
        const r = await api<{ reply: string }>('/api/ai', {
          method: 'POST',
          body: JSON.stringify({
            action: 'chat',
            preset: 'char_backstory',
            message: `角色名：${name}\n关键词：${brief}`,
          }),
        })
        await api('/api/characters', {
          method: 'PATCH',
          body: JSON.stringify({ id: card.id, type, background: r.reply }),
        })
        toast.success('AI 已生成角色小传')
        load()
      } catch (e: any) {
        toast.error(e.message)
      }
    }
  }

  // AI 生成单个设定（根据当前 Tab 类型）
  const handleAIGenSingle = async (genre: string, keywords: string) => {
    setAiGenLoading(true)
    try {
      const presetMap: Record<CardType, string> = {
        character: 'gen_character',
        worldview: 'gen_worldview',
        item: 'gen_item',
      }
      const r = await api<{ reply: string }>('/api/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'chat',
          preset: presetMap[type],
          message: `小说类型：${genre}\n关键词/要求：${keywords}`,
        }),
      })

      // 解析 AI 返回的格式化文本
      const lines = r.reply.split('\n').filter((l) => l.trim())
      const parsed: any = {}
      for (const line of lines) {
        const idx = line.indexOf('：')
        if (idx > 0) {
          const key = line.slice(0, idx).trim()
          const val = line.slice(idx + 1).trim()
          const keyMap: Record<string, string> = {
            '姓名': 'name', '名称': 'name',
            '外貌': 'appearance', '性格': 'personality',
            '背景': 'background', '功法/能力': 'abilities', '功法': 'abilities', '能力': 'abilities',
            '人物关系': 'relations', '关系': 'relations',
            '类型': 'type', '描述': 'description',
            '属性': 'attributes', '效果': 'effect',
          }
          const mappedKey = keyMap[key]
          if (mappedKey) parsed[mappedKey] = val
        }
      }

      if (!parsed.name) {
        toast.error('AI 返回格式异常，未能解析名称')
        return
      }

      // 创建设定卡
      await api('/api/characters', {
        method: 'POST',
        body: JSON.stringify({ type, ...parsed }),
      })
      toast.success(`AI 已生成${type === 'character' ? '角色' : type === 'worldview' ? '世界观' : '道具/功法'}：${parsed.name}`)
      load()
      setAiGenOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAiGenLoading(false)
    }
  }

  // AI 批量生成全套设定
  const handleAIGenBatch = async (genre: string, theme: string) => {
    setAiGenLoading(true)
    try {
      const r = await api<{ reply: string }>('/api/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'chat',
          preset: 'gen_settings_batch',
          message: `小说类型：${genre}\n主题/方向：${theme}`,
        }),
      })

      // 尝试解析 JSON
      let jsonStr = r.reply.trim()
      // 去除可能的 markdown 代码块标记
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      const data = JSON.parse(jsonStr)

      let count = 0
      // 创建角色
      if (data.characters) {
        for (const c of data.characters) {
          await api('/api/characters', {
            method: 'POST',
            body: JSON.stringify({ type: 'character', ...c }),
          })
          count++
        }
      }
      // 创建世界观
      if (data.worldviews) {
        for (const w of data.worldviews) {
          await api('/api/characters', {
            method: 'POST',
            body: JSON.stringify({ type: 'worldview', ...w }),
          })
          count++
        }
      }
      // 创建道具
      if (data.items) {
        for (const it of data.items) {
          await api('/api/characters', {
            method: 'POST',
            body: JSON.stringify({ type: 'item', ...it }),
          })
          count++
        }
      }

      toast.success(`AI 批量生成完成，共 ${count} 个设定`)
      load()
      setAiGenOpen(false)
    } catch (e: any) {
      toast.error('AI 生成失败：' + e.message)
    } finally {
      setAiGenLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">设定库</h2>
            <p className="text-sm text-muted-foreground mt-1">
              独立管理角色、世界观、道具设定，AI 写作时自动注入上下文
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAiGenOpen(true)}
              variant="outline"
              className="gap-1.5 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/20 border-violet-200 dark:border-violet-800 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30"
            >
              <Wand2 className="w-4 h-4" />
              AI 生成设定
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              新建{TYPE_LABELS[type].label}
            </Button>
          </div>
        </div>

        <Tabs value={type} onValueChange={(v) => setType(v as CardType)}>
          <TabsList>
            <TabsTrigger value="character" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              角色卡 ({cards.length})
            </TabsTrigger>
            <TabsTrigger value="worldview" className="gap-1.5">
              <Map className="w-3.5 h-3.5" />
              世界观
            </TabsTrigger>
            <TabsTrigger value="item" className="gap-1.5">
              <Sword className="w-3.5 h-3.5" />
              道具/功法
            </TabsTrigger>
          </TabsList>

          <TabsContent value={type} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : cards.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  {(() => {
                    const Icon = TYPE_LABELS[type].icon
                    return <Icon className={`w-12 h-12 mb-3 ${TYPE_LABELS[type].color} opacity-40`} />
                  })()}
                  <p className="font-medium">还没有{TYPE_LABELS[type].label}</p>
                  <p className="text-sm text-muted-foreground mt-1">点击右上角新建</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <SettingCardItem
                    key={card.id}
                    card={card}
                    type={type}
                    onEdit={() => {
                      setEditing(card)
                      setOpen(true)
                    }}
                    onDelete={() => handleDelete(card.id)}
                    onAIGenerate={() => handleAIGenerate(card)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <SettingCardDialog
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        type={type}
        card={editing}
        onSave={handleSave}
      />

      {/* AI 生成设定对话框 */}
      <AIGenDialog
        open={aiGenOpen}
        onClose={() => setAiGenOpen(false)}
        type={type}
        onGenSingle={handleAIGenSingle}
        onGenBatch={handleAIGenBatch}
        loading={aiGenLoading}
      />
    </div>
  )
}

function SettingCardItem({
  card,
  type,
  onEdit,
  onDelete,
  onAIGenerate,
}: {
  card: SettingCard
  type: CardType
  onEdit: () => void
  onDelete: () => void
  onAIGenerate: () => void
}) {
  const Icon = TYPE_LABELS[type].icon
  return (
    <Card className="group hover:shadow-md transition">
      <CardHeader className="pb-2 flex flex-row items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${
            TYPE_LABELS[type].color
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{card.name}</CardTitle>
          {type === 'character' && card.abilities && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {card.abilities}
            </p>
          )}
          {type === 'worldview' && card.type && (
            <Badge variant="outline" className="text-[10px] mt-1">
              {card.type === 'geography' ? '地理' : card.type === 'faction' ? '势力' : '历史'}
            </Badge>
          )}
          {type === 'item' && card.type && (
            <Badge variant="outline" className="text-[10px] mt-1">
              {card.type === 'item' ? '道具' : '功法'}
            </Badge>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {type === 'character' && (
          <>
            {card.personality && (
              <div>
                <span className="text-xs text-muted-foreground">性格：</span>
                <span className="line-clamp-2">{card.personality}</span>
              </div>
            )}
            {card.appearance && (
              <div>
                <span className="text-xs text-muted-foreground">外貌：</span>
                <span className="line-clamp-2">{card.appearance}</span>
              </div>
            )}
            {card.background && (
              <div>
                <span className="text-xs text-muted-foreground">背景：</span>
                <span className="line-clamp-3 text-muted-foreground">{card.background}</span>
              </div>
            )}
            {!card.background && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={onAIGenerate}
              >
                <Sparkles className="w-3 h-3 text-violet-500" />
                AI 生成背景小传
              </Button>
            )}
            {card.relations && (
              <div className="flex items-center gap-1 text-xs text-violet-600">
                <Network className="w-3 h-3" />
                <span>已设定人物关系</span>
              </div>
            )}
          </>
        )}
        {type === 'worldview' && card.description && (
          <p className="line-clamp-4 text-muted-foreground">{card.description}</p>
        )}
        {type === 'item' && (
          <>
            {card.attributes && (
              <div>
                <span className="text-xs text-muted-foreground">属性：</span>
                <span className="line-clamp-2">{card.attributes}</span>
              </div>
            )}
            {card.effect && (
              <div>
                <span className="text-xs text-muted-foreground">效果：</span>
                <span className="line-clamp-2">{card.effect}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SettingCardDialog({
  open,
  onClose,
  type,
  card,
  onSave,
}: {
  open: boolean
  onClose: () => void
  type: CardType
  card: SettingCard | null
  onSave: (data: Partial<SettingCard>) => void
}) {
  const [form, setForm] = useState<Partial<SettingCard>>({})

  useEffect(() => {
    if (card) {
      setForm(card)
    } else {
      setForm({ name: '', type: type === 'worldview' ? 'geography' : type === 'item' ? 'item' : undefined })
    }
  }, [card, type, open])

  const set = (k: keyof SettingCard, v: any) => setForm((prev) => ({ ...prev, [k]: v }))

  const handleSave = () => {
    if (!form.name?.trim()) {
      toast.error('请输入名称')
      return
    }
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {card ? '编辑' : '新建'}
            {TYPE_LABELS[type].label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder={type === 'character' ? '角色名' : type === 'worldview' ? '设定名' : '道具名'}
              />
            </div>
            {type === 'character' && (
              <div className="space-y-2">
                <Label>头像 URL（可选）</Label>
                <Input
                  value={form.avatar || ''}
                  onChange={(e) => set('avatar', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
            {type === 'worldview' && (
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={form.type || 'geography'} onValueChange={(v) => set('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geography">地理</SelectItem>
                    <SelectItem value="faction">势力</SelectItem>
                    <SelectItem value="history">历史</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {type === 'item' && (
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={form.type || 'item'} onValueChange={(v) => set('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="item">道具</SelectItem>
                    <SelectItem value="skill">功法/技能</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {type === 'character' && (
            <>
              <div className="space-y-2">
                <Label>外貌</Label>
                <Textarea
                  value={form.appearance || ''}
                  onChange={(e) => set('appearance', e.target.value)}
                  placeholder="身高、面容、衣着..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>性格</Label>
                <Textarea
                  value={form.personality || ''}
                  onChange={(e) => set('personality', e.target.value)}
                  placeholder="性格特点、说话方式..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>功法/能力</Label>
                <Textarea
                  value={form.abilities || ''}
                  onChange={(e) => set('abilities', e.target.value)}
                  placeholder="修炼功法、特殊能力..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>背景小传</Label>
                <Textarea
                  value={form.background || ''}
                  onChange={(e) => set('background', e.target.value)}
                  placeholder="身世、经历、目标..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>人物关系（JSON 或文字描述）</Label>
                <Textarea
                  value={form.relations || ''}
                  onChange={(e) => set('relations', e.target.value)}
                  placeholder={'如：\n父亲：李老汉\n挚友：王二\n宿敌：黑衣人'}
                  rows={3}
                />
              </div>
            </>
          )}

          {type === 'worldview' && (
            <div className="space-y-2">
              <Label>详细描述</Label>
              <Textarea
                value={form.description || ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="地理位置、势力分布、历史背景..."
                rows={8}
              />
            </div>
          )}

          {type === 'item' && (
            <>
              <div className="space-y-2">
                <Label>属性</Label>
                <Textarea
                  value={form.attributes || ''}
                  onChange={(e) => set('attributes', e.target.value)}
                  placeholder="等级、属性、来源..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>效果</Label>
                <Textarea
                  value={form.effect || ''}
                  onChange={(e) => set('effect', e.target.value)}
                  placeholder="使用效果、副作用、限制..."
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ AI 生成设定对话框 ============
function AIGenDialog({
  open,
  onClose,
  type,
  onGenSingle,
  onGenBatch,
  loading,
}: {
  open: boolean
  onClose: () => void
  type: CardType
  onGenSingle: (genre: string, keywords: string) => void
  onGenBatch: (genre: string, theme: string) => void
  loading: boolean
}) {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [genre, setGenre] = useState('玄幻')
  const [keywords, setKeywords] = useState('')
  const [theme, setTheme] = useState('')

  const typeLabel = type === 'character' ? '角色' : type === 'worldview' ? '世界观' : '道具/功法'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-500" />
            AI 自动生成设定
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 模式切换 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'single' ? 'default' : 'outline'}
              onClick={() => setMode('single')}
              className="gap-1.5 text-sm"
            >
              生成单个{typeLabel}
            </Button>
            <Button
              variant={mode === 'batch' ? 'default' : 'outline'}
              onClick={() => setMode('batch')}
              className="gap-1.5 text-sm"
            >
              批量生成全套
            </Button>
          </div>

          {mode === 'single' ? (
            <>
              <div className="space-y-2">
                <Label>小说类型</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['玄幻', '言情', '科幻', '悬疑', '历史', '都市', '武侠', '游戏', '奇幻'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关键词 / 要求</Label>
                <Textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder={
                    type === 'character'
                      ? '如：反派，冷酷，剑修，与主角有血海深仇'
                      : type === 'worldview'
                      ? '如：修仙宗门，位于悬崖之上，有禁地'
                      : '如：上古神器，可操控时间，有反噬'
                  }
                  rows={3}
                />
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 rounded p-3 text-xs text-violet-700 dark:text-violet-300">
                💡 AI 会根据类型和关键词自动生成一个完整的{typeLabel}设定卡，直接保存到设定库
              </div>
              <Button
                onClick={() => onGenSingle(genre, keywords)}
                disabled={loading || !keywords.trim()}
                className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {loading ? 'AI 生成中...' : `生成${typeLabel}`}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>小说类型</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['玄幻', '言情', '科幻', '悬疑', '历史', '都市', '武侠', '游戏', '奇幻'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>主题 / 方向</Label>
                <Textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="如：废材逆袭，系统流，校园+修仙..."
                  rows={3}
                />
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 rounded p-3 text-xs text-violet-700 dark:text-violet-300">
                💡 AI 会一次性生成：3 个角色 + 2 个世界观 + 2 个道具/功法，共 7 个设定卡
              </div>
              <Button
                onClick={() => onGenBatch(genre, theme)}
                disabled={loading || !theme.trim()}
                className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {loading ? 'AI 批量生成中...' : '批量生成全套设定'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
