'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatWords, formatTime } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Loader2,
  Receipt,
  Ticket,
  Gift,
  Bell,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { MessagesPanel } from './messages-panel'

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

type Section = 'profile' | 'recharge' | 'messages' | 'redeem' | 'orders'

export function UserCenter() {
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [penName, setPenName] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [payDialog, setPayDialog] = useState<{ pkg: any; orderId: string } | null>(null)
  const [payMethod, setPayMethod] = useState('alipay')
  const [paying, setPaying] = useState(false)
  const [section, setSection] = useState<Section>('profile')

  const load = async () => {
    try {
      const r = await api<UserData>('/api/user')
      setData(r)
      setName(r.user.name || '')
      setPenName(r.user.penName || '')
    } catch (e: any) {
      if (e?.status !== 401) toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const r = await api<{ orders: any[]; packages: any[] }>('/api/orders')
      setOrders(r.orders)
      setPackages(r.packages)
    } catch (e: any) {
      // 静默
    }
  }

  useEffect(() => {
    load()
    loadOrders()
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

  const handleRecharge = async (pkg: any) => {
    try {
      const r = await api<{ order: any; package: any }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ packageId: pkg.id, method: payMethod }),
      })
      setPayDialog({ pkg: r.package, orderId: r.order.id })
      toast.info('订单已创建，请在弹窗中完成支付')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handlePay = async () => {
    if (!payDialog) return
    setPaying(true)
    try {
      const r = await api<{ ok: boolean; newBalance: number }>(
        `/api/orders?id=${payDialog.orderId}`,
        { method: 'PATCH' }
      )
      toast.success(`支付成功！Token 已到账 ${r.newBalance.toLocaleString()}`)
      setPayDialog(null)
      load()
      loadOrders()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPaying(false)
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 年度热力图
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
  const weeks: { date: string; words: number }[][] = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  // 侧栏菜单
  const navs: { id: Section; label: string; icon: any; badge?: number }[] = [
    { id: 'profile', label: '资料与统计', icon: UserIcon },
    { id: 'recharge', label: '充值与会员', icon: Crown },
    { id: 'messages', label: '消息中心', icon: Bell },
    { id: 'redeem', label: '兑换码', icon: Ticket },
    { id: 'orders', label: '充值记录', icon: Receipt, badge: orders.length },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 顶部用户信息卡（精简） */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xl">
                  {(penName || name || 'W').slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base flex items-center gap-2">
                  {penName || name || '未命名'}
                  <Badge variant="outline" className="text-violet-600 border-violet-300 gap-1 text-xs">
                    <Crown className="w-3 h-3" />
                    {data.user.plan === 'pro' ? '月卡' : data.user.plan === 'year' ? '年卡' : '免费'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{data.user.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono text-sm">{data.user.tokens.toLocaleString()}</span>
                  <span className="text-muted-foreground text-xs">Token</span>
                </Badge>
                <Badge variant="outline" className="gap-1 px-2 py-1.5 text-xs">
                  <FileText className="w-3 h-3" />
                  {formatWords(data.stats.totalWords)} 字
                </Badge>
                <Badge variant="outline" className="gap-1 px-2 py-1.5 text-xs">
                  <BookOpen className="w-3 h-3" />
                  {data.stats.novelCount} 部作品
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 左侧栏 + 右侧内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* 左侧栏 */}
          <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">
            {navs.map((n) => {
              const Icon = n.icon
              const active = section === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                    active
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                  <span className="flex-1 text-left">{n.label}</span>
                  {n.badge !== undefined && n.badge > 0 && (
                    <Badge
                      variant={active ? 'secondary' : 'outline'}
                      className={`text-[10px] px-1.5 py-0 ${active ? '' : 'text-muted-foreground'}`}
                    >
                      {n.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {/* 右侧内容区 */}
          <div className="space-y-6 min-w-0">
            {section === 'profile' && (
              <ProfileSection
                data={data}
                name={name}
                penName={penName}
                setName={setName}
                setPenName={setPenName}
                onSave={handleSave}
                weeks={weeks}
              />
            )}
            {section === 'recharge' && (
              <RechargeSection
                packages={packages}
                currentPlan={data.user.plan}
                onRecharge={handleRecharge}
                onUpgrade={handleUpgrade}
              />
            )}
            {section === 'messages' && <MessagesPanel />}
            {section === 'redeem' && <RedeemCard onRedeemed={load} />}
            {section === 'orders' && <OrdersSection orders={orders} />}
          </div>
        </div>
      </div>

      {/* 模拟支付对话框 */}
      <Dialog open={!!payDialog} onOpenChange={(v) => !v && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              模拟支付
            </DialogTitle>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">套餐</span>
                  <span className="font-medium">{payDialog.pkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token 数量</span>
                  <span className="font-medium">{payDialog.pkg.tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">订单号</span>
                  <span className="font-mono text-xs">{payDialog.orderId.slice(-12)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-medium">应付金额</span>
                  <span className="font-bold text-lg text-violet-600">¥{payDialog.pkg.price}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>支付方式</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alipay">支付宝</SelectItem>
                    <SelectItem value="wechat">微信支付</SelectItem>
                    <SelectItem value="card">银行卡</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded p-3 text-xs text-amber-700 dark:text-amber-300">
                ⓘ 这是演示环境，点击下方按钮即可"完成支付"并自动到账 Token。无需真实扣款。
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>
              取消
            </Button>
            <Button onClick={handlePay} disabled={paying} className="gap-1.5">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              确认支付 ¥{payDialog?.pkg.price}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ 资料与统计 ============
function ProfileSection({
  data,
  name,
  penName,
  setName,
  setPenName,
  onSave,
  weeks,
}: {
  data: UserData
  name: string
  penName: string
  setName: (v: string) => void
  setPenName: (v: string) => void
  onSave: () => void
  weeks: { date: string; words: number }[][]
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            个人资料
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的昵称" />
            </div>
            <div className="space-y-2">
              <Label>笔名</Label>
              <Input value={penName} onChange={(e) => setPenName(e.target.value)} placeholder="将显示在作品中" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <UserIcon className="w-3 h-3 inline mr-1" />
            {data.user.email}
          </div>
          <Button onClick={onSave} size="sm" className="gap-1.5">
            <Check className="w-3.5 h-3.5" />
            保存修改
          </Button>
        </CardContent>
      </Card>

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
    </>
  )
}

// ============ 充值与会员 ============
function RechargeSection({
  packages,
  currentPlan,
  onRecharge,
  onUpgrade,
}: {
  packages: any[]
  currentPlan: string
  onRecharge: (pkg: any) => void
  onUpgrade: (plan: string) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Token 充值
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {packages.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              加载套餐...
            </div>
          ) : (
            packages.map((p) => (
              <div
                key={p.id}
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
                  <div className="text-xs text-muted-foreground">{p.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">¥{p.price}</div>
                  <Button size="sm" variant="outline" onClick={() => onRecharge(p)}>
                    购买
                  </Button>
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground text-center pt-2">
            演示版：点击购买后弹出模拟支付窗，无需真实扣款
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
              current: currentPlan === 'free',
            },
            {
              plan: 'pro',
              name: '月卡会员',
              price: '¥29.9/月',
              features: ['每日 50000 Token', '高级 AI 模型', '无限小说数量', '专属预设指令库'],
              current: currentPlan === 'pro',
              popular: true,
            },
            {
              plan: 'year',
              name: '年卡会员',
              price: '¥299/年',
              features: ['月卡全部权益', '每日 200000 Token', '专属客服', '优先新功能体验'],
              current: currentPlan === 'year',
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
                  onClick={() => onUpgrade(p.plan)}
                >
                  {p.plan === 'free' ? '降级到免费' : `升级到${p.name}`}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ 充值记录 ============
function OrdersSection({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">暂无充值记录</p>
          <p className="text-xs mt-1">前往「充值与会员」购买套餐</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          充值记录
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs sticky top-0">
              <tr>
                <th className="text-left p-3">订单号</th>
                <th className="text-left p-3">套餐</th>
                <th className="text-left p-3">金额</th>
                <th className="text-left p-3">状态</th>
                <th className="text-left p-3">时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{o.id.slice(-8)}</td>
                  <td className="p-3 text-xs">{o.tokens.toLocaleString()} Token</td>
                  <td className="p-3 font-semibold">¥{o.amount.toFixed(2)}</td>
                  <td className="p-3">
                    {o.status === 'paid' ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
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
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ 兑换码卡片 ============
function RedeemCard({ onRedeemed }: { onRedeemed: () => Promise<void> }) {
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      const r = await api<{ history: any[] }>('/api/redeem')
      setHistory(r.history)
    } catch (e) {
      // 静默
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error('请输入兑换码')
      return
    }
    setRedeeming(true)
    try {
      const r = await api('/api/redeem', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      toast.success(r.message)
      setCode('')
      onRedeemed()
      loadHistory()
    } catch (e: any) {
      toast.error(e.message || '兑换失败')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <Card className="border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50/50 to-pink-50/50 dark:from-violet-950/20 dark:to-pink-950/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Ticket className="w-4 h-4 text-violet-500" />
          兑换码
          {history.length > 0 && (
            <Badge variant="outline" className="text-xs ml-2">
              已兑换 {history.length} 次
            </Badge>
          )}
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? '收起记录' : '查看记录'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="输入兑换码，如 ABCD-1234-EFGH"
            className="font-mono tracking-wider flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          />
          <Button
            onClick={handleRedeem}
            disabled={redeeming || !code.trim()}
            className="gap-1.5 shrink-0 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
          >
            {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            立即兑换
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 兑换码可获取 Token 余额或会员权益。兑换码格式不区分大小写，可包含或省略连字符。
        </p>

        {showHistory && history.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">兑换记录</div>
            {history.map((h: any) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2 bg-card/60 rounded text-sm border border-violet-100 dark:border-violet-900"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs truncate">{h.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {h.rewardType === 'token'
                      ? `+${h.tokenAmount.toLocaleString()} Token`
                      : `${h.planReward === 'year' ? '年卡' : '月卡'}会员 ${h.planDays} 天`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <div>{formatTime(h.redeemedAt)}</div>
                  <div className="text-[10px]">
                    {h.tokensBefore.toLocaleString()} → {h.tokensAfter.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
