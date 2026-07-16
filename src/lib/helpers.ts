// 通用 fetch 工具
export async function api<T = any>(
  url: string,
  options?: RequestInit & { params?: Record<string, any> }
): Promise<T> {
  const { params, ...rest } = options || {}
  let finalUrl = url
  if (params) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) search.set(k, String(v))
    })
    const qs = search.toString()
    if (qs) finalUrl += (url.includes('?') ? '&' : '?') + qs
  }

  const res = await fetch(finalUrl, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(rest?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// 字数统计（中文按字符算）
export function countWords(text: string): number {
  if (!text) return 0
  return text.replace(/\s/g, '').length
}

// 格式化字数
export function formatWords(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toString()
}

// 格式化时间
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + '天前'
  return d.toLocaleDateString('zh-CN')
}

// 生成颜色映射
export const FOLDER_COLORS: Record<string, string> = {
  slate: 'bg-slate-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
}

// 章节状态映射
export const CHAPTER_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  draft: { label: '草稿', color: 'text-slate-500', dot: 'bg-slate-400' },
  polishing: { label: '待润色', color: 'text-amber-600', dot: 'bg-amber-500' },
  final: { label: '已定稿', color: 'text-emerald-600', dot: 'bg-emerald-500' },
}

// 小说类型
export const GENRES = ['玄幻', '言情', '科幻', '悬疑', '历史', '都市', '武侠', '游戏', '奇幻', '军事']
