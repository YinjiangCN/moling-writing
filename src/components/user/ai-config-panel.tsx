/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTime } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const PROVIDER_ICONS: Record<string, string> = {
  deepseek: '🧠',
  openai: '💬',
  claude: '🎭',
  gemini: '✨',
  grok: '🤖',
  minimax: '📊',
  custom: '⚙️',
}

export function AiConfigPanel() {
  const [configs, setConfigs] = useState<AiConfig[]>([])
  const [providers, setProviders] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AiConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

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
        await api('/api/user/ai-config', {
          method: 'PATCH',
          body: JSON.stringify({ id: editing.id, ...data }),
        })
        toast.success('已更新')
      } else {
        await api('/api/user/ai-config', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        toast.success('已添加')
      }
      setOpen(false)
      setEditing(null)
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
      const r = await api('/api/user/ai-config/test', {
        method: 'POST',
        body: JSON.stringify({ id }),
      })
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-500" />
            AI 模型配置
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            绑定你自己的 AI API Key，AI 写作将使用你配置的模型（不消耗平台 Token）
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setOpen(true) }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          添加 API
        </Button>
      </div>

      {/* 配置列表 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : configs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Cpu className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">尚未配置第三方 AI API</p>
            <p className="text-xs mt-1">
              绑定后可使用 DeepSeek / ChatGPT / Claude / Gemini / Grok / MiniMax 等模型
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {configs.map((c) => {
            const preset = providers[c.provider]
            return (
              <Card key={c.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 图标 */}
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                      {PROVIDER_ICONS[c.provider] || '⚙️'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{c.name}</span>
                        {c.isDefault && (
                          <Badge variant="default" className="text-[10px] bg-violet-500 gap-1">
                            <Star className="w-2.5 h-2.5" /> 默认
                          </Badge>
                        )}
                        {!c.enabled && (
                          <Badge variant="outline" className="text-[10px] text-amber-600">
                            已禁用
                          </Badge>
                        )}
                        {c.lastTestAt && (
                          c.lastTestOk ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> 已验证
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-red-600 gap-1">
                              <XCircle className="w-2.5 h-2.5" /> 验证失败
                            </Badge>
                          )
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>模型：<span className="font-mono">{c.model}</span></div>
                        <div>Key：{c.apiKey}</div>
                        <div className="truncate">URL：{c.baseUrl}</div>
                        {c.lastTestErr && (
                          <div className="text-red-500 text-[10px]">错误：{c.lastTestErr.slice(0, 100)}</div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
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
                        className="h-7 text-xs"
                        onClick={() => handleSetDefault(c)}
                      >
                        {c.isDefault ? '取消默认' : '设为默认'}
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => { setEditing(c); setOpen(true) }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 支持的提供商 */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">支持的 AI 提供商</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(providers).map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                  <span className="text-lg">{PROVIDER_ICONS[p.id] || '⚙️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    {p.apiKeyUrl && (
                      <a
                        href={p.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-500 hover:underline flex items-center gap-0.5"
                      >
                        获取 Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编辑/添加对话框 */}
      <ConfigDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        editing={editing}
        providers={providers}
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
  onSave,
}: {
  open: boolean
  onClose: () => void
  editing: AiConfig | null
  providers: any
  onSave: (data: any) => void
}) {
  const [provider, setProvider] = useState('deepseek')
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (editing) {
      setProvider(editing.provider)
      setName(editing.name)
      setApiKey('')
      setBaseUrl(editing.baseUrl)
      setModel(editing.model)
      setIsDefault(editing.isDefault)
    } else {
      setProvider('deepseek')
      setName('')
      setApiKey('')
      setBaseUrl('')
      setModel('')
      setIsDefault(false)
    }
  }, [editing, open])

  // 当选择提供商时，自动填入默认值
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!editing && providers[provider]) {
      const p = providers[provider]
      setBaseUrl(p.baseUrl)
      setModel(p.defaultModel)
      if (!name) setName(p.name)
    }
  }, [provider, providers, editing, name])

  const preset = providers[provider]

  const handleSave = () => {
    if (!apiKey.trim() && !editing?.hasApiKey) {
      toast.error('请填写 API Key')
      return
    }
    onSave({
      provider,
      name: name || preset?.name || provider,
      apiKey: apiKey || undefined, // 空时后端保留原 key
      baseUrl: baseUrl || preset?.baseUrl,
      model: model || preset?.defaultModel,
      isDefault,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            {editing ? '编辑 API 配置' : '添加 AI API'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 提供商选择 */}
          <div className="space-y-2">
            <Label>AI 提供商</Label>
            <Select value={provider} onValueChange={setProvider} disabled={!!editing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(providers).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {PROVIDER_ICONS[p.id] || '⚙️'} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 帮助提示 */}
          {preset?.help && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded p-3 text-xs text-blue-700 dark:text-blue-300">
              {preset.help}
              {preset.apiKeyUrl && (
                <a
                  href={preset.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline flex items-center gap-0.5 mt-1"
                >
                  点击获取 API Key <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* 显示名 */}
          <div className="space-y-2">
            <Label>显示名</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：我的 DeepSeek" />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label>API Key {editing?.hasApiKey && '（留空保留原 Key）'}</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editing?.hasApiKey ? '****（已设置）' : 'sk-...'}
            />
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.deepseek.com/v1" />
          </div>

          {/* 模型 */}
          <div className="space-y-2">
            <Label>模型</Label>
            {preset?.models?.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {preset.models.map((m: string) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">自定义...</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="模型名称"
              className={preset?.models?.length > 0 ? 'mt-2' : ''}
            />
          </div>

          {/* 设为默认 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="text-sm">设为默认 AI 模型（写作时优先使用此 API，不消耗平台 Token）</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
