'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatWords, formatTime } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Users,
  BookOpen,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Search,
  Loader2,
  Shield,
  Crown,
  Ban,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

type AdminTab = 'overview' | 'users' | 'novels' | 'orders' | 'messages'

export function AdminView() {
  const [tab, setTab] = useState<AdminTab>('overview')

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">管理后台</h2>
            <p className="text-sm text-muted-foreground">平台运营数据与用户管理</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              总览
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              用户
            </TabsTrigger>
            <TabsTrigger value="novels" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              作品
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              订单
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              AI日志
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="novels" className="mt-4">
            <NovelsTab />
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="messages" className="mt-4">
            <MessagesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ============ 总览 ============
function OverviewTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const r = await api('/api/admin/stats')
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const i = setInterval(load, 30000)
    return () => clearInterval(i)
  }, [load])

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const o = data.overview
  const cards = [
    { label: '注册用户', value: o.totalUsers, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: '作品总数', value: o.totalNovels, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: '章节总数', value: o.totalChapters, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'AI 调用次数', value: o.totalMessages, icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: '已支付订单', value: o.paidOrderCount, icon: CreditCard, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: '总收入 (¥)', value: `¥${o.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
    { label: '售出 Token', value: formatWords(o.totalTokensSold), icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: '已消耗 Token', value: formatWords(o.totalTokensUsed), icon: Zap, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: '活跃自动连载', value: o.autoSerialActive, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                  <div className={`w-7 h-7 rounded-md ${c.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                  </div>
                </div>
                <div className="text-xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 近 7 天趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">近 7 天新增趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {data.daily.map((d: any) => {
              const maxVal = Math.max(...data.daily.map((x: any) => Math.max(x.users, x.novels)), 1)
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                    <div
                      className="w-3 bg-violet-500 rounded-t"
                      style={{ height: `${(d.users / maxVal) * 100}%` }}
                      title={`新增用户：${d.users}`}
                    />
                    <div
                      className="w-3 bg-emerald-500 rounded-t"
                      style={{ height: `${(d.novels / maxVal) * 100}%` }}
                      title={`新增作品：${d.novels}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-violet-500 rounded-sm" />
              新增用户
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
              新增作品
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ 用户管理 ============
function UsersTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<any>(null)
  const [editTokens, setEditTokens] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 20 }
      if (search) params.search = search
      const r = await api('/api/admin/users', { params })
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!editing) return
    try {
      await api('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: editing.id, tokens: Number(editTokens) }),
      })
      toast.success('Token 已更新')
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleBan = async (user: any) => {
    if (!confirm(`${user.banned ? '解封' : '封禁'}用户 ${user.email}？`)) return
    try {
      await api('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: user.id, banned: !user.banned }),
      })
      toast.success(user.banned ? '已封禁' : '已解封')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSetRole = async (user: any, role: string) => {
    if (!confirm(`将 ${user.email} 设置为 ${role === 'admin' ? '管理员' : '普通用户'}？`)) return
    try {
      await api('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: user.id, role }),
      })
      toast.success('角色已更新')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="搜索邮箱 / 用户名 / 笔名"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={load} size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="text-left p-3 font-medium">用户</th>
                  <th className="text-left p-3 font-medium">Token</th>
                  <th className="text-left p-3 font-medium">套餐</th>
                  <th className="text-left p-3 font-medium">作品</th>
                  <th className="text-left p-3 font-medium">订单</th>
                  <th className="text-left p-3 font-medium">AI调用</th>
                  <th className="text-left p-3 font-medium">注册时间</th>
                  <th className="text-left p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((u: any) => (
                  <tr key={u.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xs">
                            {(u.penName || u.name || u.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate flex items-center gap-1">
                            {u.penName || u.name || '未命名'}
                            {u.role === 'admin' && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-violet-600">
                                ADMIN
                              </Badge>
                            )}
                            {u.banned && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-red-600">
                                封禁
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">{u.tokens.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {u.plan === 'pro' ? '月卡' : u.plan === 'year' ? '年卡' : '免费'}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">{u._count.novels}</td>
                    <td className="p-3 text-xs">{u._count.orders}</td>
                    <td className="p-3 text-xs">{u._count.chatMessages}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatTime(u.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditing(u)
                            setEditTokens(String(u.tokens))
                          }}
                        >
                          调Token
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 text-xs ${u.banned ? 'text-emerald-600' : 'text-red-600'}`}
                          onClick={() => handleBan(u)}
                        >
                          {u.banned ? '解封' : '封禁'}
                        </Button>
                        {u.role !== 'admin' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-violet-600"
                            onClick={() => handleSetRole(u, 'admin')}
                          >
                            设管理员
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleSetRole(u, 'user')}
                          >
                            降为用户
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.users?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      暂无用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm py-1">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整 Token 余额</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>用户</Label>
              <p className="text-sm text-muted-foreground">{editing?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>新 Token 余额</Label>
              <Input
                type="number"
                value={editTokens}
                onChange={(e) => setEditTokens(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                当前：{editing?.tokens?.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ 作品总览 ============
function NovelsTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 20 }
      if (search) params.search = search
      const r = await api('/api/admin/novels', { params })
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="搜索书名 / 作者"
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.novels?.map((n: any) => (
          <Card key={n.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-16 rounded bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-violet-300">
                    {n.title.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{n.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {n.user?.penName || n.user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge variant="outline">{n.genre}</Badge>
                    <span className="text-muted-foreground">{formatWords(n.totalWords)} 字</span>
                    <span className="text-muted-foreground">{n._count.chapters} 章</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(n.updatedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm py-1">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

// ============ 订单管理 ============
function OrdersTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api('/api/admin/orders', { params: { page, pageSize: 20 } })
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">已支付订单</div>
              <div className="text-2xl font-bold">{data.stats.paidCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">总收入 (¥)</div>
              <div className="text-2xl font-bold text-emerald-600">¥{data.stats.paidAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">售出 Token</div>
              <div className="text-2xl font-bold">{formatWords(data.stats.paidTokens)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="text-left p-3">订单ID</th>
                  <th className="text-left p-3">用户</th>
                  <th className="text-left p-3">金额</th>
                  <th className="text-left p-3">Token</th>
                  <th className="text-left p-3">方式</th>
                  <th className="text-left p-3">状态</th>
                  <th className="text-left p-3">时间</th>
                </tr>
              </thead>
              <tbody>
                {data?.orders?.map((o: any) => (
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{o.id.slice(-8)}</td>
                    <td className="p-3 text-xs">{o.user?.penName || o.user?.email}</td>
                    <td className="p-3 font-semibold">¥{o.amount.toFixed(2)}</td>
                    <td className="p-3 text-xs">{o.tokens.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {o.method === 'alipay' ? '支付宝' : o.method === 'wechat' ? '微信' : o.method}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {o.status === 'paid' ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已支付
                        </Badge>
                      ) : o.status === 'failed' ? (
                        <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                          失败
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                          待支付
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{formatTime(o.createdAt)}</td>
                  </tr>
                ))}
                {data?.orders?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      暂无订单
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm py-1">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

// ============ AI 日志 ============
function MessagesTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api('/api/admin/messages', { params: { page, pageSize: 30 } })
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data?.stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">总 AI 调用次数</div>
              <div className="text-2xl font-bold">{data.stats.totalMessages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">总消耗 Token</div>
              <div className="text-2xl font-bold">{formatWords(data.stats.totalTokensUsed)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近 AI 调用记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {data?.messages?.map((m: any) => (
            <div key={m.id} className="border rounded p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      m.role === 'user'
                        ? 'text-emerald-600 text-xs'
                        : m.role === 'assistant'
                        ? 'text-violet-600 text-xs'
                        : 'text-slate-500 text-xs'
                    }
                  >
                    {m.role === 'user' ? '用户' : m.role === 'assistant' ? 'AI' : '系统'}
                  </Badge>
                  {m.preset && (
                    <Badge variant="outline" className="text-[10px]">
                      {m.preset}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {m.user?.penName || m.user?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{m.tokensUsed} Token</span>
                  <span>{formatTime(m.createdAt)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {m.content}
              </p>
            </div>
          ))}
          {data?.messages?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">暂无记录</div>
          )}
        </CardContent>
      </Card>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm py-1">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
