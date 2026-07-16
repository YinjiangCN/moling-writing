'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatWords, formatTime, FOLDER_COLORS, GENRES } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Folder as FolderIcon,
  FolderPlus,
  BookOpen,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  Calendar,
  TrendingUp,
  Library,
  FileText,
  ChevronRight,
  Loader2,
  Wand2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { NovelWizard } from './novel-wizard'

interface Folder {
  id: string
  name: string
  color: string
  sortOrder: number
  parentId: string | null
  children?: Folder[]
  novels?: { id: string; totalWords: number }[]
  novelCount: number
  totalWords: number
}

interface Novel {
  id: string
  title: string
  cover: string | null
  author: string | null
  genre: string
  tags: string
  synopsis: string | null
  status: string
  totalWords: number
  updatedAt: string
  folderId: string | null
}

interface UserStats {
  user: { name: string | null; penName: string | null; tokens: number; plan: string }
  stats: {
    todayWords: number
    totalWords: number
    novelCount: number
    heatmap: { date: string; words: number }[]
  }
}

export function WorkspaceView() {
  const { openNovel, setCurrentFolder } = useAppStore()
  const [folders, setFolders] = useState<Folder[]>([])
  const [novels, setNovels] = useState<Novel[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('slate')

  const loadFolders = useCallback(async () => {
    try {
      const r = await api<{ folders: Folder[] }>('/api/folders')
      setFolders(r.folders)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadNovels = useCallback(async () => {
    try {
      const params: any = {}
      if (selectedFolder) params.folderId = selectedFolder
      const r = await api<{ novels: Novel[] }>('/api/novels', { params })
      setNovels(r.novels)
    } catch (e) {
      console.error(e)
    }
  }, [selectedFolder])

  const loadStats = useCallback(async () => {
    try {
      const r = await api<UserStats>('/api/user')
      setStats(r)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadFolders(), loadNovels(), loadStats()]).finally(() => setLoading(false))
  }, [loadFolders, loadNovels, loadStats])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNovels()
  }, [selectedFolder, loadNovels])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称')
      return
    }
    try {
      await api('/api/folders', {
        method: 'POST',
        body: JSON.stringify({ name: newFolderName, color: newFolderColor }),
      })
      toast.success('文件夹已创建')
      setNewFolderName('')
      setNewFolderOpen(false)
      loadFolders()
    } catch (e: any) {
      toast.error(e.message || '创建失败')
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('删除文件夹后，其中的小说将变为"未分类"。确认删除？')) return
    try {
      await api(`/api/folders?id=${id}`, { method: 'DELETE' })
      toast.success('已删除')
      loadFolders()
      loadNovels()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleRenameFolder = async (folder: Folder) => {
    const name = prompt('新文件夹名称', folder.name)
    if (!name || name === folder.name) return
    try {
      await api('/api/folders', {
        method: 'PATCH',
        body: JSON.stringify({ id: folder.id, name }),
      })
      loadFolders()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDeleteNovel = async (id: string) => {
    if (!confirm('确认删除这本小说？该操作可在回收站恢复（演示版直接删除）。')) return
    try {
      await api(`/api/novels?id=${id}`, { method: 'DELETE' })
      toast.success('已移入回收站')
      loadNovels()
      loadStats()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 生成最近 35 天热力图
  const heatmapData = (() => {
    const days: { date: string; words: number }[] = []
    const map = new Map(stats?.stats.heatmap.map((h) => [h.date, h.words]) || [])
    for (let i = 34; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({ date: dateStr, words: map.get(dateStr) || 0 })
    }
    return days
  })()

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 数据看板 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-200 dark:border-violet-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">今日新增</CardTitle>
              <TrendingUp className="w-4 h-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatWords(stats?.stats.todayWords || 0)}
                <span className="text-sm font-normal text-muted-foreground ml-1">字</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">坚持码字，越来越好</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总字数</CardTitle>
              <FileText className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatWords(stats?.stats.totalWords || 0)}
                <span className="text-sm font-normal text-muted-foreground ml-1">字</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                约 ¥{((stats?.stats.totalWords || 0) * 0.005).toFixed(2)} 稿费预估
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">作品总数</CardTitle>
              <BookOpen className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stats.novelCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">本创作资产</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Token 余额</CardTitle>
              <Sparkles className="w-4 h-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {(stats?.user.tokens || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.user.plan === 'pro' ? '月卡会员' : stats?.user.plan === 'year' ? '年卡会员' : '免费用户'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 创作日历热力图 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              近期创作日历
            </CardTitle>
            <span className="text-xs text-muted-foreground">连续码字，养成习惯</span>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 flex-wrap">
              {heatmapData.map((d) => {
                const intensity = Math.min(4, Math.floor(d.words / 1000))
                const colors = [
                  'bg-muted',
                  'bg-emerald-200 dark:bg-emerald-900',
                  'bg-emerald-400 dark:bg-emerald-700',
                  'bg-emerald-500 dark:bg-emerald-600',
                  'bg-emerald-600 dark:bg-emerald-500',
                ]
                return (
                  <div
                    key={d.date}
                    title={`${d.date}：${d.words} 字`}
                    className={`w-4 h-4 rounded-sm ${colors[intensity]} hover:ring-2 hover:ring-emerald-300 transition`}
                  />
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span>少</span>
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span>多</span>
              <span className="ml-auto">
                本月共 {heatmapData.slice(-30).reduce((s, d) => s + d.words, 0)} 字
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 文件夹 + 小说卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 文件夹侧栏 */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Library className="w-4 h-4" />
                文件夹
              </h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>

            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition ${
                !selectedFolder ? 'bg-secondary' : 'hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                全部作品
              </span>
              <Badge variant="secondary" className="text-xs">
                {stats?.stats.novelCount || 0}
              </Badge>
            </button>

            {folders.map((f) => (
              <div key={f.id} className="group">
                <button
                  onClick={() => setSelectedFolder(f.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition ${
                    selectedFolder === f.id ? 'bg-secondary' : 'hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full ${FOLDER_COLORS[f.color] || 'bg-slate-500'}`} />
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {f.novelCount}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRenameFolder(f)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteFolder(f.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </button>
                {f.totalWords > 0 && (
                  <div className="text-xs text-muted-foreground pl-8 py-0.5">
                    {formatWords(f.totalWords)} 字
                  </div>
                )}
              </div>
            ))}

            {folders.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4 px-3 border border-dashed rounded-md">
                还没有文件夹
                <br />
                点击右上角 + 创建
              </div>
            )}
          </div>

          {/* 小说卡片网格 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {selectedFolder
                  ? folders.find((f) => f.id === selectedFolder)?.name || '作品'
                  : '我的作品'}
                <span className="text-muted-foreground font-normal ml-2">({novels.length})</span>
              </h3>
              <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                创建新书
              </Button>
            </div>

            {novels.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                    <Wand2 className="w-8 h-8 text-violet-500" />
                  </div>
                  <h4 className="font-semibold mb-1">开始你的第一部作品</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    只需要一句话灵感，AI 帮你生成简介、大纲、核心角色，3 秒开启创作之旅
                  </p>
                  <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    AI 辅助建书
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {novels.map((n) => (
                  <NovelCard
                    key={n.id}
                    novel={n}
                    onOpen={() => {
                      setCurrentFolder(n.folderId)
                      openNovel(n.id)
                    }}
                    onDelete={() => handleDeleteNovel(n.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新建文件夹 */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="如：进行中 / 已完结 / 短篇练习"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
            <div className="space-y-2">
              <Label>颜色标签</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FOLDER_COLORS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setNewFolderColor(k)}
                    className={`w-7 h-7 rounded-full ${v} ${
                      newFolderColor === k ? 'ring-2 ring-offset-2 ring-foreground' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建小说向导 */}
      <NovelWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        folderId={selectedFolder}
        onCreated={(id) => {
          setWizardOpen(false)
          loadNovels()
          loadStats()
          loadFolders()
          openNovel(id)
        }}
      />
    </div>
  )
}

function NovelCard({
  novel,
  onOpen,
  onDelete,
}: {
  novel: Novel
  onOpen: () => void
  onDelete: () => void
}) {
  const genreColors: Record<string, string> = {
    玄幻: 'bg-violet-500/10 text-violet-600',
    言情: 'bg-pink-500/10 text-pink-600',
    科幻: 'bg-cyan-500/10 text-cyan-600',
    悬疑: 'bg-slate-500/10 text-slate-600',
    历史: 'bg-amber-500/10 text-amber-600',
    都市: 'bg-emerald-500/10 text-emerald-600',
    武侠: 'bg-orange-500/10 text-orange-600',
    游戏: 'bg-blue-500/10 text-blue-600',
    奇幻: 'bg-indigo-500/10 text-indigo-600',
    军事: 'bg-red-500/10 text-red-600',
  }

  return (
    <Card className="group overflow-hidden hover:shadow-md transition cursor-pointer" onClick={onOpen}>
      <div className="aspect-[3/2] bg-gradient-to-br from-violet-500/20 via-pink-500/15 to-amber-500/10 relative">
        {novel.cover ? (
          <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-bold text-violet-300/60 font-serif">
              {novel.title.slice(0, 2)}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={genreColors[novel.genre] || 'bg-muted text-muted-foreground'}>
            {novel.genre}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 bg-background/80 backdrop-blur rounded p-1 hover:bg-background"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold truncate">{novel.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-9">
          {novel.synopsis || '暂无简介'}
        </p>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{formatWords(novel.totalWords)} 字</span>
          <span>{formatTime(novel.updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge
            variant="outline"
            className={
              novel.status === 'ongoing'
                ? 'text-emerald-600 border-emerald-300'
                : novel.status === 'completed'
                ? 'text-blue-600 border-blue-300'
                : 'text-amber-600 border-amber-300'
            }
          >
            {novel.status === 'ongoing' ? '连载中' : novel.status === 'completed' ? '已完结' : '暂停'}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            打开
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
