/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTime } from '@/lib/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Star,
  Cpu,
  ChevronRight,
  Power,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface AiConfig {
  id: string
  provider: string
  name: string
  apiKey: string
  hasApiKey: boolean
  baseUrl: string
  model: string
  enabled: boolean
  isDefault: boolean
  lastTestAt: string | null
  lastTestOk: boolean
  lastTestErr: string | null
  createdAt: string
}

// 提供商配色方案
const PROVIDER_STYLES: Record<string, { label: string; gradient: string; bg: string; border: string; text: string }> = {
  deepseek: { label: 'DS', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600' },
  openai: { label: 'GPT', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600' },
  claude: { label: 'CL', gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600' },
  gemini: { label: 'GM', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-600' },
  grok: { label: 'GK', gradient: 'from-slate-600 to-slate-800', bg: 'bg-slate-500/10', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600' },
  minimax: { label: 'MM', gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600' },
  custom: { label: 'API', gradient: 'from-gray-500 to-gray-600', bg: 'bg-gray-500/10', border: 'border-gray-200 dark:border-gray-800', text: 'text-gray-600' },
}

function getStyle(provider: string) {
  return PROVIDER_STYLES[provider] || PROVIDER_STYLES.custom
}

// 提供商标识组件（文字缩写 + 渐变背景）
function ProviderLogo({ provider, className }: { provider: string; className?: string }) {
  const style = getStyle(provider)
  const size = className || 'w-5 h-5'
  return (
    <div className={`${size} rounded-md bg-gradient-to-br ${style.gradient} flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold text-[9px] leading-none tracking-tight">
        {style.label}
      </span>
    </div>
  )
}

export function AiConfigPanel() {
  const [configs, setConfigs] = useState<AiConfig[]>([])
  const [providers, setProviders] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AiConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [presetProvider, setPresetProvider] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ configs: AiConfig[]; providers: any }>('/api/user/ai-config')
      setConfigs(r.configs)
      setProviders(r.providers)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (data: any) => {
    try {
      if (editing?.id) {
        await api('/api/user/ai-config', { method: 'PATCH', body: JSON.stringify({ id: editing.id, ...data }) })
        toast.success('已更新')
      } else {
        await api('/api/user/ai-config', { method: 'POST', body: JSON.stringify(data) })
        toast.success('已添加')
      }
      setOpen(false)
      setEditing(null)
      setPresetProvider(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此 API 配置？')) return
    try {
      await api(`/api/user/ai-config?id=${id}`, { method: 'DELETE' })
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const r = await api('/api/user/ai-config/test', { method: 'POST', body: JSON.stringify({ id }) })
      toast.success(r.message || '连接成功')
      load()
    } catch (e: any) {
      toast.error('测试失败：' + e.message)
    } finally {
      setTesting(null)
    }
  }

  const handleSetDefault = async (config: AiConfig) => {
    try {
      await api('/api/user/ai-config', {
        method: 'PATCH',
        body: JSON.stringify({ id: config.id, isDefault: !config.isDefault }),
      })
      toast.success(config.isDefault ? '已取消默认' : '已设为默认 API')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleToggle = async (config: AiConfig) => {
    try {
      await api('/api/user/ai-config', {
        method: 'PATCH',
        body: JSON.stringify({ id: config.id, enabled: !config.enabled }),
      })
      toast.success(config.enabled ? '已禁用' : '已启用')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const defaultConfig = configs.find((c) => c.isDefault && c.enabled)
  const enabledCount = configs.filter((c) => c.enabled).length

  return (
    <div className="space-y-5">
      {/* 顶部状态横幅 */}
      {!loading && (
        <div className={`rounded-xl p-4 border ${
          defaultConfig
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              defaultConfig ? 'bg-emerald-500' : 'bg-amber-500'
            }`}>
              {defaultConfig ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              {defaultConfig ? (
                <>
                  <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    当前使用：{defaultConfig.name}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    {getStyle(defaultConfig.provider).icon} {providers[defaultConfig.provider]?.name || defaultConfig.provider} · {defaultConfig.model}
                    {' · AI 写作不消耗平台 Token'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {configs.length === 0 ? '尚未配置第三方 AI API' : '未设置默认 API'}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    {configs.length === 0
                      ? '绑定后 AI 写作将使用你自己的模型，不消耗平台 Token'
                      : 'AI 写作将使用平台内置模型（消耗 Token），点击下方设为默认可切换'}
                  </div>
                </>
              )}
            </div>
            {defaultConfig && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => handleTest(defaultConfig.id)}
                disabled={testing === defaultConfig.id}
              >
                {testing === defaultConfig.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                测试连接
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 已配置列表 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            已配置 API{enabledCount > 0 && `（${enabledCount} 个启用）`}
          </h3>
          <Button
            onClick={() => { setEditing(null); setPresetProvider(null); setOpen(true) }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            添加
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : configs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Cpu className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">还没有添加任何 API</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                从下方选择一个提供商开始配置
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => { setEditing(null); setPresetProvider(null); setOpen(true) }}
              >
                <Plus className="w-3.5 h-3.5" />
                添加第一个 API
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {configs.map((c) => {
              const style = getStyle(c.provider)
              return (
                <Card
                  key={c.id}
                  className={`group overflow-hidden transition-all ${
                    c.isDefault ? `border-2 ${style.border}` : ''
                  } ${!c.enabled ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* 左侧色条 */}
                      <div className={`w-1.5 bg-gradient-to-b ${style.gradient} shrink-0`} />

                      {/* 主内容 */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
                              <ProviderLogo provider={c.provider} className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm truncate">{c.name}</span>
                                {c.isDefault && (
                                  <Badge variant="default" className="text-[9px] px-1.5 py-0 gap-0.5 bg-violet-500">
                                    <Star className="w-2.5 h-2.5 fill-current" /> 默认
                                  </Badge>
                                )}
                                {!c.enabled && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600">
                                    已禁用
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                <span className={`font-mono ${style.text}`}>{c.model}</span>
                                <span className="mx-1">·</span>
                                <span className="font-mono">{c.apiKey}</span>
                              </div>
                            </div>
                          </div>

                          {/* 状态指示器 */}
                          <div className="shrink-0">
                            {c.lastTestAt && (
                              c.lastTestOk ? (
                                <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> 已验证
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] gap-1 text-red-600 border-red-300">
                                  <XCircle className="w-3 h-3" /> 异常
                                </Badge>
                              )
                            )}
                          </div>
                        </div>

                        {/* 错误信息 */}
                        {c.lastTestErr && !c.lastTestOk && (
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-2 mb-2">
                            <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-2">
                              {c.lastTestErr}
                            </p>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1.5 -ml-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            disabled={testing === c.id}
                            onClick={() => handleTest(c.id)}
                          >
                            {testing === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            测试
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleSetDefault(c)}
                          >
                            <Star className={`w-3 h-3 ${c.isDefault ? 'fill-violet-500 text-violet-500' : ''}`} />
                            {c.isDefault ? '取消默认' : '设默认'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleToggle(c)}
                          >
                            <Power className="w-3 h-3" />
                            {c.enabled ? '禁用' : '启用'}
                          </Button>
                          <div className="ml-auto flex gap-0.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => { setEditing(c); setPresetProvider(null); setOpen(true) }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-600"
                              onClick={() => handleDelete(c.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 快速添加 - 提供商预设网格 */}
      {!loading && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            快速添加 API
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Object.values(providers).map((p: any) => {
              const style = getStyle(p.id)
              const isAdded = configs.some((c) => c.provider === p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setEditing(null)
                    setPresetProvider(p.id)
                    setOpen(true)
                  }}
                  className={`group relative text-left p-3 rounded-xl border transition-all hover:shadow-md hover:scale-[1.02] ${style.border} ${style.bg}`}
                >
                  {isAdded && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <ProviderLogo provider={p.id} className="w-6 h-6" />
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2">
                    {p.defaultModel}
                  </div>
                  {p.apiKeyUrl && (
                    <a
                      href={p.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-violet-500 hover:underline flex items-center gap-0.5 mt-1.5"
                    >
                      获取 Key <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 编辑/添加对话框 */}
      <ConfigDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); setPresetProvider(null) }}
        editing={editing}
        providers={providers}
        presetProvider={presetProvider}
        onSave={handleSave}
      />
    </div>
  )
}

// ============ 配置对话框 ============
function ConfigDialog({
  open,
  onClose,
  editing,
  providers,
  presetProvider,
  onSave,
}: {
  open: boolean
  onClose: () => void
  editing: AiConfig | null
  providers: any
  presetProvider: string | null
  onSave: (data: any) => void
}) {
  const [provider, setProvider] = useState('deepseek')
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [showCustomModel, setShowCustomModel] = useState(false)

  useEffect(() => {
    if (editing) {
      setProvider(editing.provider)
      setName(editing.name)
      setApiKey('')
      setBaseUrl(editing.baseUrl)
      setModel(editing.model)
      setIsDefault(editing.isDefault)
      setShowCustomModel(false)
    } else if (presetProvider) {
      setProvider(presetProvider)
      setName('')
      setApiKey('')
      setModel('')
      setIsDefault(false)
      setShowCustomModel(false)
      if (providers[presetProvider]) {
        const p = providers[presetProvider]
        setBaseUrl(p.baseUrl)
        setModel(p.defaultModel)
        setName(p.name)
      }
    } else {
      setProvider('deepseek')
      setName('')
      setApiKey('')
      setModel('')
      setIsDefault(false)
      setShowCustomModel(false)
      if (providers['deepseek']) {
        setBaseUrl(providers['deepseek'].baseUrl)
        setModel(providers['deepseek'].defaultModel)
      }
    }
  }, [editing, open, presetProvider, providers])

  const preset = providers[provider]
  const style = getStyle(provider)

  const handleProviderChange = (p: string) => {
    setProvider(p)
    if (providers[p]) {
      setBaseUrl(providers[p].baseUrl)
      setModel(providers[p].defaultModel)
      if (!name || name === preset?.name) setName(providers[p].name)
    }
    setShowCustomModel(false)
  }

  const handleSave = () => {
    if (!apiKey.trim() && !editing?.hasApiKey) {
      toast.error('请填写 API Key')
      return
    }
    onSave({
      provider,
      name: name || preset?.name || provider,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || preset?.baseUrl,
      model: model || preset?.defaultModel,
      isDefault,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ProviderLogo provider={provider} className="w-5 h-5" />
            {editing ? '编辑 API 配置' : `添加 ${preset?.name || 'API'}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 提供商选择（非编辑模式时显示网格） */}
          {!editing && (
            <div className="space-y-2">
              <Label>选择 AI 提供商</Label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(providers).map((p: any) => {
                  const ps = getStyle(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`p-2.5 rounded-lg border-2 transition-all text-center ${
                        provider === p.id
                          ? `${ps.border} ${ps.bg} scale-105`
                          : 'border-transparent bg-muted/40 hover:bg-muted'
                      }`}
                    >
                      <div className="mb-0.5 flex items-center justify-center">
                        <ProviderLogo provider={p.id} className="w-7 h-7" />
                      </div>
                      <div className="text-[10px] font-medium truncate">{p.name.split(' ')[0]}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 帮助提示 */}
          {preset?.help && (
            <div className={`rounded-lg p-3 text-xs border ${style.border} ${style.bg}`}>
              <div className="flex items-start gap-2">
                <ProviderLogo provider={provider} className="w-4 h-4 shrink-0" />
                <div className="flex-1">
                  <p className={style.text}>{preset.help}</p>
                  {preset.apiKeyUrl && (
                    <a
                      href={preset.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-0.5 mt-1.5 underline ${style.text}`}
                    >
                      点击获取 API Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 显示名 */}
          <div className="space-y-1.5">
            <Label className="text-xs">显示名</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：我的 DeepSeek"
              className="h-9"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              API Key
              {editing?.hasApiKey && <span className="text-muted-foreground ml-1">（留空保留原 Key）</span>}
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editing?.hasApiKey ? '••••（已设置，输入新值可替换）' : 'sk-...'}
              className="h-9 font-mono"
            />
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="h-9 font-mono text-xs"
            />
          </div>

          {/* 模型选择 */}
          <div className="space-y-1.5">
            <Label className="text-xs">模型</Label>
            {preset?.models?.length > 0 && !showCustomModel && (
              <div className="flex flex-wrap gap-1.5">
                {preset.models.map((m: string) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition ${
                      model === m
                        ? `${style.bg} ${style.text} border ${style.border}`
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomModel(true)}
                  className="px-2.5 py-1.5 rounded-md text-xs bg-muted/50 hover:bg-muted text-muted-foreground"
                >
                  自定义...
                </button>
              </div>
            )}
            {(showCustomModel || !preset?.models?.length) && (
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="模型名称"
                className="h-9 font-mono text-xs"
              />
            )}
            {showCustomModel && preset?.models?.length > 0 && (
              <button
                onClick={() => setShowCustomModel(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                ← 返回选择
              </button>
            )}
          </div>

          {/* 设为默认 */}
          <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium">设为默认 AI 模型</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                AI 写作时优先使用此 API，不消耗平台 Token
              </p>
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {editing ? '保存修改' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
