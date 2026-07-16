'use client'

import { useEffect, useState } from 'react'
import { api, formatWords } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User as UserIcon,
  Sparkles,
  Calendar,
  Crown,
  Zap,
  TrendingUp,
  FileText,
  BookOpen,
  Settings,
  CreditCard,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  user: {
    id: string
    name: string | null
    penName: string | null
    email: string
    avatar: string | null
    tokens: number
    plan: string
  }
  stats: {
    todayWords: number
    totalWords: number
    novelCount: number
    heatmap: { date: string; words: number }[]
  }
}

export function UserCenter() {
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [penName, setPenName] = useState('')

  const load = async () => {
    try {
      const r = await api<UserData>('/api/user')
      setData(r)
      setName(r.user.name || '')
      setPenName(r.user.penName || '')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    try {
      await api('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ name, penName }),
      })
      toast.success('已保存')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleRecharge = async (tokens: number) => {
    if (!data) return
    try {
      await api('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ tokens: data.user.tokens + tokens }),
      })
      toast.success(`已充值 ${tokens} Token`)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleUpgrade = async (plan: string) => {
    try {
      await api('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ plan }),
      })
      toast.success('已升级')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  // 生成全年热力图
  const heatmapData = (() => {
    const map = new Map(data.stats.heatmap.map((h) => [h.date, h.words]))
    const days: { date: string; words: number }[] = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({ date: dateStr, words: map.get(dateStr) || 0 })
    }
    return days
  })()

  // 按周分组
  const weeks: { date: string; words: number }[][] = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 用户信息卡 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-2xl">
                  {(penName || name || 'W').slice(0, 1)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>用户名</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>笔名</Label>
                    <Input value={penName} onChange={(e) => setPenName(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                    {data.user.email}
                  </span>
                  <Badge variant="outline" className="gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {data.user.tokens.toLocaleString()} Token
                  </Badge>
                  <Badge variant="outline" className="text-violet-600 border-violet-300 gap-1.5">
                    <Crown className="w-3 h-3" />
                    {data.user.plan === 'pro'
                      ? '月卡会员'
                      : data.user.plan === 'year'
                      ? '年卡会员'
                      : '免费用户'}
                  </Badge>
                  <Button onClick={handleSave} size="sm" className="ml-auto">
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 创作统计 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">今日字数</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWords(data.stats.todayWords)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总字数</CardTitle>
              <FileText className="w-4 h-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWords(data.stats.totalWords)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">作品数</CardTitle>
              <BookOpen className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.novelCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* 全年热力图 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              年度创作热力图
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const intensity = Math.min(4, Math.floor(day.words / 1500))
                      const colors = [
                        'bg-muted',
                        'bg-emerald-200 dark:bg-emerald-900',
                        'bg-emerald-400 dark:bg-emerald-700',
                        'bg-emerald-500 dark:bg-emerald-600',
                        'bg-emerald-600 dark:bg-emerald-500',
                      ]
                      return (
                        <div
                          key={day.date}
                          title={`${day.date}：${day.words} 字`}
                          className={`w-3 h-3 rounded-sm ${colors[intensity]}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span>少</span>
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span>多</span>
            </div>
          </CardContent>
        </Card>

        {/* 充值与会员 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Token 充值
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { tokens: 50000, price: '¥9.9', desc: '入门体验' },
                { tokens: 200000, price: '¥29.9', desc: '常用之选', popular: true },
                { tokens: 1000000, price: '¥99.9', desc: '深度创作' },
              ].map((p) => (
                <div
                  key={p.tokens}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    p.popular ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">
                      {p.tokens.toLocaleString()} Token
                      {p.popular && (
                        <Badge className="ml-2 bg-amber-500" variant="default">
                          推荐
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{p.price}</div>
                    <Button size="sm" variant="outline" onClick={() => handleRecharge(p.tokens)}>
                      充值
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">
                演示版：充值不扣款，仅模拟 Token 到账
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-violet-500" />
                会员订阅
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  plan: 'free',
                  name: '免费版',
                  price: '¥0',
                  features: ['每日 5000 Token', '基础 AI 模型', '最多 3 部小说'],
                  current: data.user.plan === 'free',
                },
                {
                  plan: 'pro',
                  name: '月卡会员',
                  price: '¥29.9/月',
                  features: ['每日 50000 Token', '高级 AI 模型', '无限小说数量', '专属预设指令库'],
                  current: data.user.plan === 'pro',
                  popular: true,
                },
                {
                  plan: 'year',
                  name: '年卡会员',
                  price: '¥299/年',
                  features: ['月卡全部权益', '每日 200000 Token', '专属客服', '优先新功能体验'],
                  current: data.user.plan === 'year',
                },
              ].map((p) => (
                <div
                  key={p.plan}
                  className={`p-3 border rounded-lg ${
                    p.popular ? 'border-violet-300 bg-violet-50 dark:bg-violet-950/20' : ''
                  } ${p.current ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold flex items-center gap-2">
                      {p.name}
                      {p.popular && (
                        <Badge className="bg-violet-500" variant="default">
                          热门
                        </Badge>
                      )}
                      {p.current && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                          当前
                        </Badge>
                      )}
                    </div>
                    <div className="font-bold">{p.price}</div>
                  </div>
                  <ul className="text-xs space-y-1 mb-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!p.current && (
                    <Button
                      size="sm"
                      variant={p.popular ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleUpgrade(p.plan)}
                    >
                      {p.plan === 'free' ? '降级到免费' : `升级到${p.name}`}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 功能预告 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              高级功能（即将上线）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { name: '社区广场', desc: '发布作品、读者互动、月票打赏' },
                { name: '多端同步', desc: '手机、平板、桌面无缝衔接' },
                { name: '版本历史', desc: '自动快照、回滚历史版本' },
                { name: '回收站', desc: '30 天可恢复，防误删' },
                { name: '导入导出', desc: 'TXT/Word/EPUB/Markdown' },
                { name: 'API Key 绑定', desc: '自定义 AI 模型与价格' },
              ].map((f) => (
                <div key={f.name} className="flex items-start gap-2 p-3 bg-muted/40 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
