'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTime } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bell,
  Megaphone,
  Trash2,
  Mail,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  Wrench,
  Gift,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  pinned: boolean
  createdAt: string
  publishAt: string | null
  isRead: boolean
}

interface Message {
  id: string
  title: string
  content: string
  type: string
  senderName: string
  emailSent: boolean
  createdAt: string
  isRead: boolean
}

const annTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  info: { label: '通知', icon: Info, color: 'text-blue-500' },
  warning: { label: '提醒', icon: AlertTriangle, color: 'text-amber-500' },
  success: { label: '好消息', icon: CheckCircle2, color: 'text-emerald-500' },
  maintenance: { label: '维护', icon: Wrench, color: 'text-violet-500' },
}

const msgTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  notice: { label: '通知', icon: Bell, color: 'text-blue-500' },
  system: { label: '系统', icon: Info, color: 'text-violet-500' },
  warning: { label: '警告', icon: AlertCircle, color: 'text-amber-500' },
  reward: { label: '奖励', icon: Gift, color: 'text-emerald-500' },
}

export function MessagesPanel() {
  const [tab, setTab] = useState<'messages' | 'announcements'>('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [openItem, setOpenItem] = useState<{ type: 'msg' | 'ann'; data: any } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [annR, msgR] = await Promise.all([
        api<{ items: Announcement[]; unreadCount: number }>('/api/announcements').catch(() => ({ items: [], unreadCount: 0 })),
        api<{ items: Message[]; unreadCount: number }>('/api/messages').catch(() => ({ items: [], unreadCount: 0 })),
      ])
      setAnnouncements(annR.items || [])
      setMessages(msgR.items || [])
    } catch (e: any) {
      // 静默
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleOpenAnn = async (item: Announcement) => {
    setOpenItem({ type: 'ann', data: item })
    if (!item.isRead) {
      try {
        await api(`/api/announcements/read?id=${item.id}`, { method: 'POST' })
        load()
      } catch {}
    }
  }

  const handleOpenMsg = async (item: Message) => {
    setOpenItem({ type: 'msg', data: item })
    if (!item.isRead) {
      try {
        await api(`/api/messages/read?id=${item.id}`, { method: 'POST' })
        load()
      } catch {}
    }
  }

  const handleDeleteMsg = async (id: string) => {
    if (!confirm('确认删除这条消息？')) return
    try {
      await api(`/api/messages?id=${id}`, { method: 'DELETE' })
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const unreadMsgs = messages.filter((m) => !m.isRead).length
  const unreadAnns = announcements.filter((a) => !a.isRead).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-500" />
            消息中心
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={tab === 'announcements' ? 'default' : 'ghost'}
              onClick={() => setTab('announcements')}
              className="h-7 text-xs gap-1.5"
            >
              <Megaphone className="w-3 h-3" />
              公告
              {unreadAnns > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{unreadAnns}</Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant={tab === 'messages' ? 'default' : 'ghost'}
              onClick={() => setTab('messages')}
              className="h-7 text-xs gap-1.5"
            >
              <Mail className="w-3 h-3" />
              消息
              {unreadMsgs > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{unreadMsgs}</Badge>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : tab === 'announcements' ? (
          announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
              暂无平台公告
            </div>
          ) : (
            announcements.map((a) => {
              const tc = annTypeConfig[a.type] || annTypeConfig.info
              const Icon = tc.icon
              return (
                <div
                  key={a.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition ${
                    !a.isRead ? 'border-violet-200 bg-violet-50/30 dark:bg-violet-950/10' : ''
                  }`}
                  onClick={() => handleOpenAnn(a)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 ${tc.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {a.pinned && <Badge variant="default" className="text-[9px] px-1 py-0 bg-violet-500">置顶</Badge>}
                        <span className="font-medium text-sm truncate">{a.title}</span>
                        {!a.isRead && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 whitespace-pre-wrap">
                        {a.content}
                      </p>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(a.publishAt || a.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
            暂无消息
          </div>
        ) : (
          messages.map((m) => {
            const tc = msgTypeConfig[m.type] || msgTypeConfig.notice
            const Icon = tc.icon
            return (
              <div
                key={m.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition group ${
                  !m.isRead ? 'border-violet-200 bg-violet-50/30 dark:bg-violet-950/10' : ''
                }`}
                onClick={() => handleOpenMsg(m)}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${tc.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${tc.color}`}>{tc.label}</Badge>
                      <span className="font-medium text-sm truncate">{m.title}</span>
                      {!m.isRead && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 whitespace-pre-wrap">
                      {m.content}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px] text-muted-foreground">
                        来自 {m.senderName} · {formatTime(m.createdAt)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMsg(m.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>

      {/* 详情对话框 */}
      <Dialog open={!!openItem} onOpenChange={(v) => !v && setOpenItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {openItem?.type === 'ann' ? (
                <>
                  <Megaphone className="w-4 h-4 text-violet-500" />
                  平台公告
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-violet-500" />
                  消息详情
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {openItem && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {openItem.type === 'ann' ? (
                  <>
                    {openItem.data.pinned && <Badge variant="default" className="bg-violet-500">置顶</Badge>}
                    {(() => {
                      const tc = annTypeConfig[openItem.data.type] || annTypeConfig.info
                      return <Badge variant="outline" className={tc.color}>{tc.label}</Badge>
                    })()}
                  </>
                ) : (
                  <>
                    {(() => {
                      const tc = msgTypeConfig[openItem.data.type] || msgTypeConfig.notice
                      return <Badge variant="outline" className={tc.color}>{tc.label}</Badge>
                    })()}
                    {openItem.data.emailSent && (
                      <Badge variant="outline" className="text-emerald-600">
                        <Mail className="w-3 h-3 mr-1" />邮件已发送
                      </Badge>
                    )}
                  </>
                )}
                <h3 className="font-semibold text-lg flex-1">{openItem.data.title}</h3>
              </div>
              <div className="bg-muted/30 rounded p-4 max-h-96 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{openItem.data.content}</p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {openItem.type === 'ann'
                    ? `发布时间：${formatTime(openItem.data.publishAt || openItem.data.createdAt)}`
                    : `发送人：${openItem.data.senderName} · ${formatTime(openItem.data.createdAt)}`}
                </span>
                {openItem.type === 'msg' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-600"
                    onClick={() => {
                      handleDeleteMsg(openItem.data.id)
                      setOpenItem(null)
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    删除此消息
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
