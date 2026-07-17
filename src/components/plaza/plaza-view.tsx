'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatWords, formatTime } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  Heart,
  Bookmark,
  Eye,
  Loader2,
  Flame,
  Clock,
  Star,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['全部', '玄幻', '言情', '科幻', '悬疑', '历史', '都市', '武侠', '游戏', '奇幻']

export function PlazaView() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest' | 'hot' | 'featured'>('latest')
  const [readingId, setReadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 20, sort }
      if (category && category !== '全部') params.category = category
      if (search) params.search = search
      const r = await api('/api/plaza', { params })
      setItems(r.items)
      setTotalPages(r.totalPages)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, category, search, sort])

  useEffect(() => {
    load()
  }, [load])

  const handleLike = async (id: string, isLiked: boolean) => {
    // 乐观更新
    setItems((prev) => prev.map((it) =>
      it.id === id
        ? { ...it, isLiked: !isLiked, likeCount: isLiked ? it.likeCount - 1 : it.likeCount + 1 }
        : it
    ))
    try {
      await api('/api/plaza/like', {
        method: 'POST',
        body: JSON.stringify({ publicationId: id }),
      })
    } catch (e: any) {
      // 回滚
      setItems((prev) => prev.map((it) =>
        it.id === id
          ? { ...it, isLiked, likeCount: isLiked ? it.likeCount + 1 : it.likeCount - 1 }
          : it
      ))
      toast.error(e.message)
    }
  }

  const handleCollect = async (id: string, isCollected: boolean) => {
    setItems((prev) => prev.map((it) =>
      it.id === id
        ? { ...it, isCollected: !isCollected, collectCount: isCollected ? it.collectCount - 1 : it.collectCount + 1 }
        : it
    ))
    try {
      await api('/api/plaza/collect', {
        method: 'POST',
        body: JSON.stringify({ publicationId: id }),
      })
    } catch (e: any) {
      setItems((prev) => prev.map((it) =>
        it.id === id
          ? { ...it, isCollected, collectCount: isCollected ? it.collectCount + 1 : it.collectCount - 1 }
          : it
      ))
      toast.error(e.message)
    }
  }

  if (readingId) {
    return <ReaderView publicationId={readingId} onBack={() => { setReadingId(null); load() }} />
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 顶部 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">作品广场</h2>
            <p className="text-sm text-muted-foreground">发现精彩原创小说</p>
          </div>
        </div>

        {/* 搜索 + 排序 */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜索书名、简介、标签..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={sort === 'latest' ? 'default' : 'outline'} onClick={() => { setSort('latest'); setPage(1) }}>
              <Clock className="w-3.5 h-3.5 mr-1" /> 最新
            </Button>
            <Button size="sm" variant={sort === 'hot' ? 'default' : 'outline'} onClick={() => { setSort('hot'); setPage(1) }}>
              <Flame className="w-3.5 h-3.5 mr-1" /> 热门
            </Button>
            <Button size="sm" variant={sort === 'featured' ? 'default' : 'outline'} onClick={() => { setSort('featured'); setPage(1) }}>
              <Star className="w-3.5 h-3.5 mr-1" /> 推荐
            </Button>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat || (cat === '全部' && !category) ? 'default' : 'outline'}
              onClick={() => { setCategory(cat === '全部' ? '' : cat); setPage(1) }}
              className="text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* 作品网格 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无作品</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((p) => (
              <Card key={p.id} className="group overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => setReadingId(p.id)}>
                <div className="aspect-[3/4] bg-gradient-to-br from-violet-500/20 via-pink-500/15 to-amber-500/10 relative">
                  {p.cover ? (
                    <img src={p.cover} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-violet-300/40 font-serif">
                        {p.title.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  {p.featured && (
                    <Badge className="absolute top-2 left-2 bg-amber-500">
                      <Star className="w-3 h-3 mr-1" /> 推荐
                    </Badge>
                  )}
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {p.category}
                  </Badge>
                </div>
                <CardContent className="p-3 space-y-2">
                  <h4 className="font-semibold truncate">{p.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 h-8">{p.synopsis}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-[8px] bg-violet-500 text-white">
                        {(p.user?.penName || p.user?.name || 'A')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{p.user?.penName || p.user?.name || '匿名'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatWords(p.novel?.totalWords || 0)} 字</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(p.id, p.isLiked) }}
                        className={`flex items-center gap-0.5 hover:text-pink-500 transition ${p.isLiked ? 'text-pink-500' : 'text-muted-foreground'}`}
                      >
                        <Heart className={`w-3 h-3 ${p.isLiked ? 'fill-current' : ''}`} />
                        {p.likeCount}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCollect(p.id, p.isCollected) }}
                        className={`flex items-center gap-0.5 hover:text-amber-500 transition ${p.isCollected ? 'text-amber-500' : 'text-muted-foreground'}`}
                      >
                        <Bookmark className={`w-3 h-3 ${p.isCollected ? 'fill-current' : ''}`} />
                        {p.collectCount}
                      </button>
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {p.viewCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <span className="text-sm py-1">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ 读者阅读页 ============
function ReaderView({ publicationId, onBack }: { publicationId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentChapter, setCurrentChapter] = useState<any>(null)
  const [allChapters, setAllChapters] = useState<any[]>([])
  const [chapterContent, setChapterContent] = useState<string>('')
  const [loadingChapter, setLoadingChapter] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api(`/api/plaza/${publicationId}`)
      setData(r)
      // 收集所有章节
      const chapters: any[] = []
      r.publication.novel.volumes.forEach((v: any) => {
        v.chapters.forEach((c: any) => {
          chapters.push({ ...c, volumeTitle: v.title })
        })
      })
      setAllChapters(chapters)
      // 恢复阅读进度
      if (r.userState.readProgress?.chapterId) {
        const ch = chapters.find((c) => c.id === r.userState.readProgress.chapterId)
        if (ch) {
          setCurrentChapter(ch)
          return
        }
      }
      if (chapters.length > 0) {
        setCurrentChapter(chapters[0])
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [publicationId])

  useEffect(() => {
    load()
  }, [load])

  // 加载章节内容
  useEffect(() => {
    if (!currentChapter) return
    setLoadingChapter(true)
    api(`/api/chapters?id=${currentChapter.id}`)
      .then((r) => {
        setChapterContent(r.chapter.content || '')
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingChapter(false))

    // 记录阅读进度
    const sortOrder = currentChapter.sortOrder
    api('/api/plaza/read', {
      method: 'POST',
      body: JSON.stringify({
        publicationId,
        chapterId: currentChapter.id,
        chapterSortOrder: sortOrder,
        readWords: currentChapter.words,
      }),
    }).catch(() => {})
  }, [currentChapter, publicationId])

  const handleLike = async () => {
    if (!data) return
    try {
      const r = await api('/api/plaza/like', {
        method: 'POST',
        body: JSON.stringify({ publicationId }),
      })
      setData((prev: any) => ({
        ...prev,
        publication: { ...prev.publication, likeCount: prev.publication.likeCount + (r.isLiked ? 1 : -1) },
        userState: { ...prev.userState, isLiked: r.isLiked },
      }))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleCollect = async () => {
    if (!data) return
    try {
      const r = await api('/api/plaza/collect', {
        method: 'POST',
        body: JSON.stringify({ publicationId }),
      })
      setData((prev: any) => ({
        ...prev,
        publication: { ...prev.publication, collectCount: prev.publication.collectCount + (r.isCollected ? 1 : -1) },
        userState: { ...prev.userState, isCollected: r.isCollected },
      }))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const currentIndex = currentChapter ? allChapters.findIndex((c) => c.id === currentChapter.id) : -1

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const pub = data.publication

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 返回 + 标题 */}
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1">
          ← 返回广场
        </Button>

        {/* 作品信息 */}
        <div className="flex gap-4 mb-6 pb-6 border-b">
          <div className="w-20 h-28 rounded bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-violet-300/60 font-serif">
              {pub.title.slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-1">{pub.title}</h1>
            <p className="text-sm text-muted-foreground mb-2">
              作者：{pub.user?.penName || pub.user?.name || '匿名'}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{pub.synopsis}</p>
            <div className="flex items-center gap-3 text-xs">
              <Badge variant="secondary">{pub.category}</Badge>
              <span className="text-muted-foreground">{formatWords(pub.novel.totalWords)} 字</span>
              <span className="text-muted-foreground">{allChapters.length} 章</span>
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 hover:text-pink-500 transition ${data.userState.isLiked ? 'text-pink-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${data.userState.isLiked ? 'fill-current' : ''}`} />
                {pub.likeCount}
              </button>
              <button
                onClick={handleCollect}
                className={`flex items-center gap-1 hover:text-amber-500 transition ${data.userState.isCollected ? 'text-amber-500' : 'text-muted-foreground'}`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${data.userState.isCollected ? 'fill-current' : ''}`} />
                {pub.collectCount}
              </button>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                {pub.viewCount}
              </span>
            </div>
          </div>
        </div>

        {/* 章节内容 */}
        {currentChapter && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{currentChapter.title}</h2>
              <span className="text-xs text-muted-foreground">
                第 {currentIndex + 1} / {allChapters.length} 章
              </span>
            </div>

            {loadingChapter ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-base leading-loose whitespace-pre-wrap font-serif">
                  {chapterContent || '（本章暂无内容）'}
                </div>
              </div>
            )}

            {/* 上下章 */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex <= 0}
                onClick={() => currentIndex > 0 && setCurrentChapter(allChapters[currentIndex - 1])}
              >
                ← 上一章
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {allChapters.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex >= allChapters.length - 1}
                onClick={() => currentIndex < allChapters.length - 1 && setCurrentChapter(allChapters[currentIndex + 1])}
              >
                下一章 →
              </Button>
            </div>
          </>
        )}

        {/* 章节目录 */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium hover:text-violet-500">
            查看目录（{allChapters.length} 章）
          </summary>
          <div className="mt-2 max-h-60 overflow-y-auto border rounded p-2 space-y-1">
            {allChapters.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setCurrentChapter(c)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition ${
                  currentChapter?.id === c.id ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : ''
                }`}
              >
                <span className="text-muted-foreground text-xs mr-2">第{i + 1}章</span>
                {c.title}
                <span className="text-xs text-muted-foreground ml-2">{formatWords(c.words)}字</span>
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}
