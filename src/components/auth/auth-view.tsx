'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PenLine, Sparkles, Mail, Lock, User, Loader2, BookOpen, Wand2, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface UserPublic {
  id: string
  email: string
  name: string | null
  penName: string | null
  avatar: string | null
  tokens: number
  plan: string
  role: string
  banned: boolean
  createdAt: string
}

export function AuthView() {
  const { setUser, setView } = useAppStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  // 登录
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // 注册
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regPenName, setRegPenName] = useState('')
  const [regCode, setRegCode] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendCode = async () => {
    if (!regEmail.trim()) {
      toast.error('请先输入邮箱')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      toast.error('邮箱格式不正确')
      return
    }
    setCodeSending(true)
    try {
      const r = await api<{ ok: boolean; message?: string }>('/api/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail, purpose: 'register' }),
      })
      toast.success(r.message || '验证码已发送')
      setCountdown(60)
    } catch (e: any) {
      toast.error(e.message || '发送失败')
    } finally {
      setCodeSending(false)
    }
  }

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('请输入邮箱和密码')
      return
    }
    setLoginLoading(true)
    try {
      const r = await api<{ user: UserPublic }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      setUser(r.user)
      toast.success(`欢迎回来，${r.user.penName || r.user.name || r.user.email}！`)
      setView(r.user.role === 'admin' ? 'admin' : 'workspace')
    } catch (e: any) {
      toast.error(e.message || '登录失败')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!regEmail.trim() || !regPassword) {
      toast.error('请输入邮箱和密码')
      return
    }
    if (regPassword.length < 6) {
      toast.error('密码至少 6 位')
      return
    }
    if (!regCode.trim()) {
      toast.error('请输入邮箱验证码')
      return
    }
    setRegLoading(true)
    try {
      const r = await api<{ user: UserPublic }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName,
          penName: regPenName,
          code: regCode,
        }),
      })
      setUser(r.user)
      toast.success(`注册成功，赠送 10000 Token！`)
      setView('workspace')
    } catch (e: any) {
      toast.error(e.message || '注册失败')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50 dark:from-violet-950/30 dark:via-pink-950/20 dark:to-amber-950/20">
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-3.5rem)]">
        {/* 左侧介绍 */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">墨灵写作</h1>
              <p className="text-sm text-muted-foreground">AI 驱动的网文创作平台</p>
            </div>
          </div>

          <p className="text-lg leading-relaxed">
            一句话灵感自动生成简介、大纲、角色。
            <br />
            AI 长文本记忆，再不卡文、再不失忆。
            <br />
            一键开启自动连载，睡着也在更新。
          </p>

          <div className="space-y-3">
            {[
              { icon: Wand2, title: 'AI 辅助建书', desc: '一句话 → 简介+大纲+三角色' },
              { icon: BookOpen, title: '沉浸式三栏编辑器', desc: '打字机模式 / 深色 / 护眼' },
              { icon: Zap, title: '自动连载', desc: 'AI 定时生成新章节' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg backdrop-blur-sm border border-violet-100 dark:border-violet-900">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 右侧表单 */}
        <Card className="shadow-xl border-violet-100 dark:border-violet-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              开始你的创作之旅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••"
                      className="pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
                >
                  {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  登录
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label>邮箱 *</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* 验证码 */}
                <div className="space-y-2">
                  <Label>邮箱验证码 *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      placeholder="6 位验证码"
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={codeSending || countdown > 0}
                      className="shrink-0 w-32"
                    >
                      {codeSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : countdown > 0 ? (
                        `${countdown}s 后重发`
                      ) : (
                        '发送验证码'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    验证码将发送至你的邮箱，10 分钟内有效
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>用户名</Label>
                    <Input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="你的昵称"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>笔名</Label>
                    <Input
                      value={regPenName}
                      onChange={(e) => setRegPenName(e.target.value)}
                      placeholder="将显示在作品中"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>密码 *（至少 6 位）</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••"
                      className="pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={regLoading}
                  className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
                >
                  {regLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  注册并赠送 10000 Token
                </Button>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground text-center mt-4">
              登录即表示同意《用户协议》和《隐私政策》
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
