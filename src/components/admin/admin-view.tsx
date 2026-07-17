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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Settings,
  Mail,
  Send,
  Save,
  Server,
  Ticket,
  Copy,
  Plus,
  Download,
  Trash2,
  Pencil,
  Megaphone,
} from 'lucide-react'
import { toast } from 'sonner'

type AdminTab = 'overview' | 'users' | 'novels' | 'orders' | 'messages' | 'email' | 'redeem' | 'announcements' | 'broadcast'

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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-9 h-auto">
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
            <TabsTrigger value="announcements" className="gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              公告
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              群发
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              邮箱
            </TabsTrigger>
            <TabsTrigger value="redeem" className="gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              兑换码
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
          <TabsContent value="announcements" className="mt-4">
            <AnnouncementsTab />
          </TabsContent>
          <TabsContent value="broadcast" className="mt-4">
            <BroadcastTab />
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <EmailConfigTab />
          </TabsContent>
          <TabsContent value="redeem" className="mt-4">
            <RedeemCodesTab />
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

  const handleBackup = (type: string) => {
    const a = document.createElement('a')
    a.href = `/api/admin/backup?type=${type}`
    a.download = `moli-backup-${type}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('已开始下载备份文件')
  }

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

      {/* 数据备份 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4" />
            数据备份
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            导出平台数据为 JSON 文件，可用于数据迁移或灾备。建议定期备份。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              className="gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
              onClick={() => handleBackup('all')}
            >
              <Download className="w-3.5 h-3.5" />
              全量备份
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBackup('novels')}>
              <BookOpen className="w-3.5 h-3.5" />
              作品数据
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBackup('users')}>
              <Users className="w-3.5 h-3.5" />
              用户数据
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBackup('orders')}>
              <CreditCard className="w-3.5 h-3.5" />
              订单数据
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleBackup('settings')}>
              <Settings className="w-3.5 h-3.5" />
              设定库数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
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
      const r = await api('/api/admin/ai-logs', { params: { page, pageSize: 30 } })
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
              <div className="text-2xl font-bold">{data.stats.totalMessages || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">总消耗 Token</div>
              <div className="text-2xl font-bold">{formatWords(data.stats.totalTokensUsed || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 预设使用统计 */}
      {data?.stats?.presetStats?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">预设指令使用统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.stats.presetStats.map((p: any) => (
                <Badge key={p.preset} variant="outline" className="text-xs gap-1">
                  {p.preset}
                  <span className="text-muted-foreground">{p.count}次</span>
                  <span className="text-amber-500">{formatWords(p.tokens)}T</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近 AI 调用记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {data?.items?.map((m: any) => (
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
                    {m.user?.penName || m.user?.email || '未知'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{m.tokensUsed || 0} Token</span>
                  <span>{formatTime(m.createdAt)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {m.content}
              </p>
            </div>
          ))}
          {data?.items?.length === 0 && (
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

// ============ 邮箱配置 ============
function EmailConfigTab() {
  const [config, setConfig] = useState<any>(null)
  const [presets, setPresets] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(465)
  const [smtpSecure, setSmtpSecure] = useState(true)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [fromName, setFromName] = useState('墨灵写作')
  const [enabled, setEnabled] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ config: any; presets: Record<string, any> }>('/api/admin/email-config')
      setConfig(r.config)
      setPresets(r.presets || {})
      if (r.config) {
        setSmtpHost(r.config.smtpHost || '')
        setSmtpPort(r.config.smtpPort || 465)
        setSmtpSecure(r.config.smtpSecure ?? true)
        setSmtpUser(r.config.smtpUser || '')
        setSmtpPass('')
        setFromName(r.config.fromName || '墨灵写作')
        setEnabled(r.config.enabled ?? true)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!smtpHost.trim() || !smtpUser.trim()) {
      toast.error('请填写 SMTP 服务器和邮箱账号')
      return
    }
    if (!smtpPass && !config?.hasPassword) {
      toast.error('请填写邮箱密码或授权码')
      return
    }
    setSaving(true)
    try {
      await api('/api/admin/email-config', {
        method: 'POST',
        body: JSON.stringify({
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpSecure,
          smtpUser,
          smtpPass: smtpPass || '******',
          fromName,
          enabled,
        }),
      })
      toast.success('配置已保存')
      setSmtpPass('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePreset = (key: string) => {
    const p = presets[key]
    if (!p) return
    setSmtpHost(p.host)
    setSmtpPort(p.port)
    setSmtpSecure(p.secure)
    toast.info(`已应用 ${key} 预设：${p.help}`)
  }

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast.error('请输入测试收件邮箱')
      return
    }
    setTesting(true)
    try {
      const r = await api<{ ok: boolean; message?: string }>('/api/admin/email-test', {
        method: 'POST',
        body: JSON.stringify({ targetEmail: testEmail.trim() }),
      })
      toast.success(r.message || '测试邮件发送成功')
      load()
    } catch (e: any) {
      toast.error('测试失败：' + e.message)
    } finally {
      setTesting(false)
    }
  }

  const handleToggleEnabled = async () => {
    try {
      await api('/api/admin/email-config', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !enabled }),
      })
      setEnabled(!enabled)
      toast.success(!enabled ? '邮件服务已启用' : '邮件服务已禁用')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const currentPresetKey = Object.keys(presets).find((k) => presets[k].host === smtpHost)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4" />
            邮件服务状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="outline"
                  className={
                    enabled
                      ? 'text-emerald-600 border-emerald-300'
                      : 'text-amber-600 border-amber-300'
                  }
                >
                  {enabled ? '● 已启用' : '● 已禁用'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  SMTP：{config.smtpHost}:{config.smtpPort} ({config.smtpSecure ? 'SSL' : 'STARTTLS'})
                </span>
                <span className="text-sm text-muted-foreground">
                  发件账号：{config.smtpUser}
                </span>
                <Button variant="outline" size="sm" onClick={handleToggleEnabled} className="ml-auto">
                  {enabled ? '禁用' : '启用'}
                </Button>
              </div>
              {config.lastTestAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {config.lastTestOk ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Ban className="w-3 h-3 text-red-500" />
                  )}
                  上次测试：{formatTime(config.lastTestAt)}
                  {!config.lastTestOk && config.lastTestErr && (
                    <span className="text-red-500"> - {config.lastTestErr.slice(0, 100)}</span>
                  )}
                </div>
              )}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded p-3 text-xs text-amber-800 dark:text-amber-200">
                ⓘ 配置好 SMTP 后，用户注册时将必须通过邮箱验证码验证才能完成注册。
                未配置或禁用时，注册功能将不可用。
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-40" />
              <p className="text-sm font-medium">尚未配置邮件服务</p>
              <p className="text-xs text-muted-foreground mt-1">
                配置后用户注册将需要邮箱验证码
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4" />
            {config ? '修改 SMTP 配置' : '配置 SMTP 邮箱'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>常见邮箱预设</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presets).map(([k, p]: [string, any]) => (
                <Button
                  key={k}
                  variant={smtpHost === p.host ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreset(k)}
                  className="text-xs"
                >
                  {k}
                </Button>
              ))}
            </div>
            {currentPresetKey && (
              <p className="text-xs text-muted-foreground">
                {presets[currentPresetKey]?.help}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>SMTP 服务器地址 *</Label>
              <Input
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="如 smtp.163.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP 端口</Label>
              <Input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                placeholder="465 / 587"
              />
            </div>
            <div className="space-y-2">
              <Label>加密方式</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={smtpSecure ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSmtpSecure(true)}
                  className="flex-1"
                >
                  SSL (465)
                </Button>
                <Button
                  type="button"
                  variant={!smtpSecure ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSmtpSecure(false)}
                  className="flex-1"
                >
                  STARTTLS (587)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>邮箱账号 *</Label>
              <Input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="如 moling_support@163.com"
              />
            </div>
            <div className="space-y-2">
              <Label>密码 / 授权码 {config?.hasPassword && '(已设置，留空保留)'}</Label>
              <Input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder={config?.hasPassword ? '••••••（保留原密码留空）' : '邮箱密码或授权码'}
              />
            </div>
            <div className="space-y-2">
              <Label>发件人显示名</Label>
              <Input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="墨灵写作"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded p-3 text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-medium">📌 网易 163 邮箱注意事项：</p>
            <p>1. 必须使用「授权码」而非邮箱登录密码</p>
            <p>2. 在 163 邮箱设置 → POP3/SMTP/IMAP 中开启 SMTP 服务</p>
            <p>3. 在「客户端授权密码」中生成授权码</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存配置
            </Button>
          </div>
        </CardContent>
      </Card>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4" />
              发送测试邮件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="输入收件邮箱地址"
              />
              <Button onClick={handleTest} disabled={testing} className="gap-1.5 shrink-0">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                发送测试
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              建议使用与配置邮箱不同的地址进行测试，以验证邮件投递是否正常。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============ 兑换码管理 ============
function RedeemCodesTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [exporting, setExporting] = useState(false)

  // 生成表单
  const [genOpen, setGenOpen] = useState(false)
  const [genCount, setGenCount] = useState(10)
  const [genRewardType, setGenRewardType] = useState<'token' | 'plan'>('token')
  const [genTokenAmount, setGenTokenAmount] = useState(50000)
  const [genPlanReward, setGenPlanReward] = useState<'pro' | 'year'>('pro')
  const [genPlanDays, setGenPlanDays] = useState(30)
  const [genBatchNote, setGenBatchNote] = useState('')
  const [genExpiresAt, setGenExpiresAt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<any>(null)

  // 通用码选项
  const [genIsGeneric, setGenIsGeneric] = useState(false)
  const [genMaxUses, setGenMaxUses] = useState(0)

  // 自定义兑换码
  const [genIsCustom, setGenIsCustom] = useState(false)
  const [genCustomCode, setGenCustomCode] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 20 }
      if (statusFilter) params.status = statusFilter
      if (batchFilter) params.batchId = batchFilter
      if (search) params.search = search
      if (typeFilter) params.isGeneric = typeFilter === 'generic' ? 'true' : 'false'
      const r = await api('/api/admin/redeem-codes', { params })
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, batchFilter, search, typeFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleGenerate = async () => {
    if (genRewardType === 'token' && genTokenAmount <= 0) {
      toast.error('Token 数量必须大于 0')
      return
    }
    if (genRewardType === 'plan' && genPlanDays <= 0) {
      toast.error('会员天数必须大于 0')
      return
    }

    // 自定义码模式
    if (genIsCustom) {
      if (!genCustomCode.trim()) {
        toast.error('请输入自定义兑换码')
        return
      }
      setGenerating(true)
      try {
        const body: any = {
          rewardType: genRewardType,
          batchNote: genBatchNote,
          expiresAt: genExpiresAt || null,
          isGeneric: true,
          maxUses: Number(genMaxUses) || 0,
          isCustom: true,
          customCode: genCustomCode,
        }
        if (genRewardType === 'token') body.tokenAmount = Number(genTokenAmount)
        else {
          body.planReward = genPlanReward
          body.planDays = Number(genPlanDays)
        }
        const r = await api('/api/admin/redeem-codes', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        setGenResult(r)
        toast.success(r.message)
        setGenCustomCode('')
        load()
      } catch (e: any) {
        toast.error(e.message)
      } finally {
        setGenerating(false)
      }
      return
    }

    // 批量生成模式
    if (genCount < 1 || genCount > 1000) {
      toast.error('数量必须在 1-1000 之间')
      return
    }
    setGenerating(true)
    try {
      const body: any = {
        count: Number(genCount),
        rewardType: genRewardType,
        batchNote: genBatchNote,
        expiresAt: genExpiresAt || null,
        isGeneric: genIsGeneric,
        maxUses: genIsGeneric ? Number(genMaxUses) || 0 : 0,
      }
      if (genRewardType === 'token') body.tokenAmount = Number(genTokenAmount)
      else {
        body.planReward = genPlanReward
        body.planDays = Number(genPlanDays)
      }
      const r = await api('/api/admin/redeem-codes', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setGenResult(r)
      toast.success(r.message)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      params.set('export', 'csv')
      if (statusFilter) params.set('status', statusFilter)
      if (batchFilter) params.set('batchId', batchFilter)
      if (search) params.set('search', search)
      if (typeFilter === 'generic') params.set('isGeneric', 'true')
      if (typeFilter === 'exclusive') params.set('isGeneric', 'false')
      
      // 直接浏览器下载（带 cookie）
      const url = `/api/admin/redeem-codes?${params.toString()}`
      const a = document.createElement('a')
      a.href = url
      a.download = `redeem-codes-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('CSV 文件已下载')
    } catch (e: any) {
      toast.error('导出失败：' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteOne = async (id: string) => {
    if (!confirm('确认删除此兑换码？此操作不可恢复。')) return
    try {
      const r = await api(`/api/admin/redeem-codes?id=${id}`, { method: 'DELETE' })
      toast.success(r.message)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleAction = async (id: string, action: 'disable' | 'enable') => {
    try {
      await api('/api/admin/redeem-codes', {
        method: 'PATCH',
        body: JSON.stringify({ id, action }),
      })
      toast.success(action === 'disable' ? '已禁用' : '已启用')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('确认删除该批次所有未使用的兑换码？')) return
    try {
      const r = await api(`/api/admin/redeem-codes?batchId=${batchId}`, { method: 'DELETE' })
      toast.success(r.message)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('已复制到剪贴板')
    })
  }

  const copyAllCodes = () => {
    if (!genResult?.codes?.length) return
    const text = genResult.codes.join('\n')
    copyToClipboard(text)
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
      {/* 统计卡片 */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">总兑换码</div>
              <div className="text-xl font-bold">{data.stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">未使用</div>
              <div className="text-xl font-bold text-emerald-600">{data.stats.unused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">已使用</div>
              <div className="text-xl font-bold text-blue-600">{data.stats.used}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">已禁用</div>
              <div className="text-xl font-bold text-red-600">{data.stats.disabled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => { setGenOpen(true); setGenResult(null) }} className="gap-1.5">
          <Plus className="w-4 h-4" />
          创建兑换码
        </Button>
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-1.5">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          导出 CSV
        </Button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="搜索兑换码 / 批次备注"
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter || 'all'}
          onValueChange={(v) => {
            setTypeFilter(v === 'all' ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="generic">通用码</SelectItem>
            <SelectItem value="exclusive">独占码</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => {
            setStatusFilter(v === 'all' ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="unused">未使用</SelectItem>
            <SelectItem value="used">已使用</SelectItem>
            <SelectItem value="disabled">已禁用</SelectItem>
          </SelectContent>
        </Select>
        {batchFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchFilter('')}
            className="gap-1.5"
          >
            清除批次筛选
          </Button>
        )}
      </div>

      {/* 批次列表 */}
      {data?.batches?.length > 0 && !batchFilter && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">最近批次</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.batches.slice(0, 5).map((b: any) => (
              <div
                key={b.batchId}
                className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs truncate">{b.batchId}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.batchNote || '无备注'} · {b._count.id} 个
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBatchFilter(b.batchId)
                    setPage(1)
                  }}
                >
                  查看
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 兑换码表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs sticky top-0">
                <tr>
                  <th className="text-left p-3">兑换码</th>
                  <th className="text-left p-3">奖励</th>
                  <th className="text-left p-3">类型</th>
                  <th className="text-left p-3">状态</th>
                  <th className="text-left p-3">使用次数</th>
                  <th className="text-left p-3">批次</th>
                  <th className="text-left p-3">使用时间</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {data?.codes?.map((c: any) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium tracking-wider">{c.code}</span>
                        {c.isCustom && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-pink-600">
                            自定义
                          </Badge>
                        )}
                        <button
                          onClick={() => copyToClipboard(c.code)}
                          className="opacity-50 hover:opacity-100"
                          title="复制"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <Badge variant="outline" className={c.rewardType === 'token' ? 'text-amber-600' : 'text-violet-600'}>
                        {c.rewardDesc}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {c.isGeneric ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                          通用码
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600 text-xs">
                          独占码
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {c.status === 'unused' ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                          未使用
                        </Badge>
                      ) : c.status === 'used' ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                          {c.isGeneric ? '已用完' : '已使用'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                          已禁用
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {c.isGeneric ? (
                        <span>
                          {c.totalUsed}
                          {c.maxUses > 0 && <span className="text-muted-foreground"> / {c.maxUses}</span>}
                          <span className="text-muted-foreground ml-1">次</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {c.batchNote || c.batchId?.slice(-8) || (c.isCustom ? '-' : '-')}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {c.usedAt ? formatTime(c.usedAt) : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {c.status === 'unused' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600"
                            onClick={() => handleAction(c.id, 'disable')}
                          >
                            禁用
                          </Button>
                        )}
                        {c.status === 'disabled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-emerald-600"
                            onClick={() => handleAction(c.id, 'enable')}
                          >
                            启用
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600"
                          onClick={() => handleDeleteOne(c.id)}
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.codes?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      暂无兑换码
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页 */}
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

      {/* 生成对话框 */}
      <Dialog open={genOpen} onOpenChange={(v) => {
        setGenOpen(v)
        if (!v) setGenResult(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              {genIsCustom ? '创建自定义通用兑换码' : '批量生成兑换码'}
            </DialogTitle>
          </DialogHeader>

          {genResult ? (
            <div className="space-y-3 py-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded p-3 text-sm text-emerald-700 dark:text-emerald-300">
                ✓ {genResult.message}
                {genResult.batchId && <>（批次 ID：{genResult.batchId.slice(-12)}）</>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>生成的兑换码列表</Label>
                  <Button size="sm" variant="outline" onClick={copyAllCodes} className="gap-1.5">
                    <Copy className="w-3 h-3" />
                    复制全部
                  </Button>
                </div>
                <div className="bg-muted/50 rounded p-3 max-h-60 overflow-y-auto">
                  {genResult.codes.map((c: string, i: number) => (
                    <div key={i} className="font-mono text-sm py-0.5 flex items-center justify-between">
                      <span>{c}</span>
                      <button
                        onClick={() => copyToClipboard(c)}
                        className="opacity-50 hover:opacity-100"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setGenOpen(false); setGenResult(null) }}>
                  完成
                </Button>
                <Button onClick={() => setGenResult(null)}>继续生成</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                {/* 模式切换：批量生成 / 自定义通用码 */}
                <div className="space-y-2">
                  <Label>创建模式</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={!genIsCustom ? 'default' : 'outline'}
                      onClick={() => setGenIsCustom(false)}
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      批量生成
                    </Button>
                    <Button
                      type="button"
                      variant={genIsCustom ? 'default' : 'outline'}
                      onClick={() => setGenIsCustom(true)}
                      className="gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      自定义通用码
                    </Button>
                  </div>
                </div>

                {/* 自定义码输入 */}
                {genIsCustom && (
                  <div className="space-y-2">
                    <Label>自定义兑换码 *</Label>
                    <Input
                      value={genCustomCode}
                      onChange={(e) => setGenCustomCode(e.target.value.toUpperCase())}
                      placeholder="如 WELCOME2024 / VIP100"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      仅字母数字，4-32 位。将作为通用码（一人一次，多人可用）。
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>奖励类型</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={genRewardType === 'token' ? 'default' : 'outline'}
                      onClick={() => setGenRewardType('token')}
                      className="gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Token 余额
                    </Button>
                    <Button
                      type="button"
                      variant={genRewardType === 'plan' ? 'default' : 'outline'}
                      onClick={() => setGenRewardType('plan')}
                      className="gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      会员权益
                    </Button>
                  </div>
                </div>

                {genRewardType === 'token' ? (
                  <div className="space-y-2">
                    <Label>每个兑换码的 Token 数量</Label>
                    <Input
                      type="number"
                      value={genTokenAmount}
                      onChange={(e) => setGenTokenAmount(Number(e.target.value))}
                      placeholder="如 50000"
                    />
                    <div className="flex gap-2 text-xs">
                      {[10000, 50000, 100000, 500000].map((n) => (
                        <Button
                          key={n}
                          variant="outline"
                          size="sm"
                          onClick={() => setGenTokenAmount(n)}
                        >
                          {n.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>会员类型</Label>
                      <Select value={genPlanReward} onValueChange={(v) => setGenPlanReward(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pro">月卡 (pro)</SelectItem>
                          <SelectItem value="year">年卡 (year)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>会员天数</Label>
                      <Input
                        type="number"
                        value={genPlanDays}
                        onChange={(e) => setGenPlanDays(Number(e.target.value))}
                        placeholder="如 30"
                      />
                    </div>
                    <div className="col-span-2 flex gap-2 text-xs">
                      <Button variant="outline" size="sm" onClick={() => { setGenPlanReward('pro'); setGenPlanDays(30) }}>
                        月卡 30 天
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setGenPlanReward('pro'); setGenPlanDays(90) }}>
                        季卡 90 天
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setGenPlanReward('year'); setGenPlanDays(365) }}>
                        年卡 365 天
                      </Button>
                    </div>
                  </div>
                )}

                {/* 通用码选项（批量模式也可选） */}
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isGeneric"
                      checked={genIsGeneric || genIsCustom}
                      disabled={genIsCustom}
                      onChange={(e) => setGenIsGeneric(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isGeneric" className="cursor-pointer">
                      设为通用兑换码（一个码多人可兑换，每人限一次）
                    </Label>
                  </div>
                  {(genIsGeneric || genIsCustom) && (
                    <div className="space-y-2 pl-6">
                      <Label>最大使用次数（0 = 不限）</Label>
                      <Input
                        type="number"
                        min={0}
                        value={genMaxUses}
                        onChange={(e) => setGenMaxUses(Number(e.target.value))}
                        placeholder="如 100，0 表示不限"
                      />
                      <p className="text-xs text-muted-foreground">
                        通用码可以被多个用户兑换，但同一用户仅可兑换一次。设为 0 表示不限次数。
                      </p>
                    </div>
                  )}
                </div>

                {!genIsCustom && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>生成数量（1-1000）</Label>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={genCount}
                        onChange={(e) => setGenCount(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>过期时间（可选）</Label>
                      <Input
                        type="datetime-local"
                        value={genExpiresAt}
                        onChange={(e) => setGenExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {genIsCustom && (
                  <div className="space-y-2">
                    <Label>过期时间（可选）</Label>
                    <Input
                      type="datetime-local"
                      value={genExpiresAt}
                      onChange={(e) => setGenExpiresAt(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>批次备注（可选）</Label>
                  <Input
                    value={genBatchNote}
                    onChange={(e) => setGenBatchNote(e.target.value)}
                    placeholder="如：双十一活动 / 内测福利"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded p-3 text-xs text-blue-800 dark:text-blue-200">
                  预览：将创建
                  <b>
                    {genIsCustom
                      ? ` 1 个自定义通用兑换码「${genCustomCode || '...'}」`
                      : ` ${genCount} 个${genIsGeneric ? '通用' : '独占'}兑换码`}
                  </b>
                  ，每个奖励为
                  <b>
                    {genRewardType === 'token'
                      ? ` ${genTokenAmount.toLocaleString()} Token`
                      : ` ${genPlanReward === 'year' ? '年卡' : '月卡'}会员 ${genPlanDays} 天`}
                  </b>
                  {(genIsGeneric || genIsCustom) && genMaxUses > 0 && `，最大使用 ${genMaxUses} 次`}
                  {genExpiresAt && `，过期时间 ${new Date(genExpiresAt).toLocaleString('zh-CN')}`}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleGenerate} disabled={generating} className="gap-1.5">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {genIsCustom ? '创建' : `生成 ${genCount} 个`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ 公告管理 ============
function AnnouncementsTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)

  // 表单
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('info')
  const [published, setPublished] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [publishAt, setPublishAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [emailTarget, setEmailTarget] = useState('all')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api('/api/admin/announcements', { params: { page, pageSize: 20 } })
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

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setContent('')
    setType('info')
    setPublished(false)
    setPinned(false)
    setPublishAt('')
    setExpiresAt('')
    setSendEmail(false)
    setEmailTarget('all')
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setTitle(item.title)
    setContent(item.content)
    setType(item.type)
    setPublished(item.published)
    setPinned(item.pinned)
    setPublishAt(item.publishAt ? new Date(item.publishAt).toISOString().slice(0, 16) : '')
    setExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '')
    setSendEmail(false)
    setEmailTarget('all')
    setOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('标题和内容不能为空')
      return
    }
    setSaving(true)
    try {
      const body: any = {
        title, content, type, published, pinned,
        publishAt: publishAt || null,
        expiresAt: expiresAt || null,
        sendEmail,
        emailTarget,
      }
      if (editing) {
        await api('/api/admin/announcements', { method: 'PATCH', body: JSON.stringify({ id: editing.id, ...body }) })
      } else {
        await api('/api/admin/announcements', { method: 'POST', body: JSON.stringify(body) })
      }
      toast.success(editing ? '已更新' : '已创建')
      setOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此公告？此操作不可恢复。')) return
    try {
      await api(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handlePublish = async (item: any) => {
    if (!confirm(`确认${item.published ? '撤回' : '发布'}公告「${item.title}」？`)) return
    try {
      await api('/api/admin/announcements', {
        method: 'PATCH',
        body: JSON.stringify({ id: item.id, published: !item.published }),
      })
      toast.success(item.published ? '已撤回' : '已发布')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    info: { label: '通知', color: 'text-blue-600', bg: 'bg-blue-500/10' },
    warning: { label: '提醒', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    success: { label: '好消息', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    maintenance: { label: '维护', color: 'text-violet-600', bg: 'bg-violet-500/10' },
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
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">总公告</div><div className="text-xl font-bold">{data.stats.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">已发布</div><div className="text-xl font-bold text-emerald-600">{data.stats.published}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">草稿</div><div className="text-xl font-bold text-amber-600">{data.stats.draft}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">置顶</div><div className="text-xl font-bold text-violet-600">{data.stats.pinned}</div></CardContent></Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">公告列表</h3>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          新建公告
        </Button>
      </div>

      <div className="space-y-3">
        {data?.items?.map((item: any) => {
          const tc = typeConfig[item.type] || typeConfig.info
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {item.pinned && <Badge variant="default" className="text-[10px] bg-violet-500">置顶</Badge>}
                      <Badge variant="outline" className={`text-xs ${tc.color} ${tc.bg}`}>{tc.label}</Badge>
                      {!item.published && (
                        <Badge variant="outline" className="text-xs text-amber-600">草稿</Badge>
                      )}
                      <span className="font-semibold truncate">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{item.content}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      创建：{formatTime(item.createdAt)} · 已读：{item._count?.reads || 0} 人
                      {item.publishAt && ` · 计划发布：${formatTime(item.publishAt)}`}
                      {item.expiresAt && ` · 过期：${formatTime(item.expiresAt)}`}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(item)}>
                      <Pencil className="w-3 h-3 mr-1" /> 编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 text-xs ${item.published ? 'text-amber-600' : 'text-emerald-600'}`}
                      onClick={() => handlePublish(item)}
                    >
                      {item.published ? '撤回' : '发布'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> 删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {data?.items?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无公告，点击右上角新建
            </CardContent>
          </Card>
        )}
      </div>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="text-sm py-1">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}

      {/* 编辑/创建对话框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑公告' : '新建公告'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>标题 *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：平台维护通知" />
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">通知（蓝色）</SelectItem>
                  <SelectItem value="warning">提醒（黄色）</SelectItem>
                  <SelectItem value="success">好消息（绿色）</SelectItem>
                  <SelectItem value="maintenance">维护（紫色）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>内容 *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="公告正文，支持换行..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>计划发布时间（可选）</Label>
                <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>过期时间（可选）</Label>
                <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                <span className="text-sm">立即发布</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                <span className="text-sm">置顶</span>
              </label>
            </div>

            {published && (
              <div className="border-t pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                  <span className="text-sm">同时发送邮件通知所有用户</span>
                </label>
                {sendEmail && (
                  <div className="space-y-2 pl-6">
                    <Label>邮件发送范围</Label>
                    <Select value={emailTarget} onValueChange={setEmailTarget}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有用户</SelectItem>
                        <SelectItem value="paid">仅付费会员</SelectItem>
                        <SelectItem value="free">仅免费用户</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {published ? '发布' : '保存草稿'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ 消息群发 ============
function BroadcastTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<any[]>([])
  const [usersSearch, setUsersSearch] = useState('')

  // 表单
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('notice')
  const [targetMode, setTargetMode] = useState<'all' | 'paid' | 'free' | 'specific'>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [sendEmail, setSendEmail] = useState(false)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api('/api/admin/messages', { params: { page, pageSize: 20 } })
      setData(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  const loadUsers = useCallback(async () => {
    try {
      const r = await api('/api/admin/users', { params: { pageSize: 100, search: usersSearch } })
      setUsers(r.users)
    } catch (e: any) {
      // ignore
    }
  }, [usersSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (targetMode === 'specific') loadUsers()
  }, [targetMode, loadUsers])

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('标题和内容不能为空')
      return
    }
    if (targetMode === 'specific' && selectedUserIds.length === 0) {
      toast.error('请选择至少一个用户')
      return
    }
    setSending(true)
    try {
      const body: any = {
        title, content, type, targetMode, sendEmail,
        userIds: targetMode === 'specific' ? selectedUserIds : [],
      }
      const r = await api('/api/admin/messages', { method: 'POST', body: JSON.stringify(body) })
      toast.success(r.message)
      // 重置
      setTitle('')
      setContent('')
      setSelectedUserIds([])
      setSendEmail(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此消息？此操作不可恢复。')) return
    try {
      await api(`/api/admin/messages?id=${id}`, { method: 'DELETE' })
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const typeConfig: Record<string, { label: string; color: string }> = {
    notice: { label: '通知', color: 'text-blue-600' },
    system: { label: '系统', color: 'text-violet-600' },
    warning: { label: '警告', color: 'text-amber-600' },
    reward: { label: '奖励', color: 'text-emerald-600' },
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 发送消息表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4" />
            发送消息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>标题 *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：账户异常提醒" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">通知</SelectItem>
                  <SelectItem value="system">系统消息</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="reward">奖励</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>接收范围</Label>
              <Select value={targetMode} onValueChange={(v: any) => setTargetMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有用户（群发）</SelectItem>
                  <SelectItem value="paid">仅付费会员（群发）</SelectItem>
                  <SelectItem value="free">仅免费用户（群发）</SelectItem>
                  <SelectItem value="specific">指定用户（单发）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>内容 *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="消息正文..."
              rows={5}
            />
          </div>

          {/* 指定用户选择 */}
          {targetMode === 'specific' && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label>选择用户（已选 {selectedUserIds.length} 个）</Label>
                <Input
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  placeholder="搜索邮箱/昵称"
                  className="w-48 h-7 text-xs"
                />
              </div>
              <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-1">
                {users.map((u: any) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id])
                        else setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id))
                      }}
                    />
                    <span className="font-medium">{u.penName || u.name || '未命名'}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {u.plan === 'year' ? '年卡' : u.plan === 'pro' ? '月卡' : '免费'}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 邮件通知 */}
          <div className="border-t pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              <span className="text-sm">同时发送邮件通知（每人一封）</span>
            </label>
            {sendEmail && (
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                ⓘ 邮件将发送至{targetMode === 'all' ? '所有用户' : targetMode === 'paid' ? '付费会员' : targetMode === 'free' ? '免费用户' : `选中的 ${selectedUserIds.length} 个用户`}的注册邮箱
              </p>
            )}
          </div>

          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            发送消息
          </Button>
        </CardContent>
      </Card>

      {/* 历史消息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">历史消息（{data?.stats?.total || 0}）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.items?.map((item: any) => {
            const tc = typeConfig[item.type] || typeConfig.notice
            return (
              <div key={item.id} className="border rounded p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={`text-xs ${tc.color}`}>{tc.label}</Badge>
                      {item.userId === null ? (
                        <Badge variant="outline" className="text-xs text-blue-600">群发</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-violet-600">单发</Badge>
                      )}
                      {item.emailSent && (
                        <Badge variant="outline" className="text-xs text-emerald-600">
                          <Mail className="w-3 h-3 mr-1" />邮件已发
                        </Badge>
                      )}
                      <span className="font-medium truncate">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{item.content}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      来自 {item.senderName} · {formatTime(item.createdAt)} · 已读 {item._count?.reads || 0}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-600 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
          {data?.items?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">暂无消息</div>
          )}
        </CardContent>
      </Card>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="text-sm py-1">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  )
}
