'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Rocket,
  Settings,
  Code,
  Server,
  CreditCard,
  Mail,
  Users,
  PenLine,
  Bot,
  Shield,
  Database,
  ChevronRight,
  Search,
} from 'lucide-react'

const SECTIONS = [
  { id: 'overview', title: '产品概述', icon: BookOpen },
  { id: 'quickstart', title: '快速上手', icon: Rocket },
  { id: 'writing', title: '写作功能指南', icon: PenLine },
  { id: 'ai', title: 'AI 创作助手', icon: Bot },
  { id: 'settings', title: '设定库管理', icon: Settings },
  { id: 'plaza', title: '作品广场', icon: Users },
  { id: 'billing', title: '计费与支付', icon: CreditCard },
  { id: 'email', title: '邮件系统', icon: Mail },
  { id: 'api', title: 'API 接口文档', icon: Code },
  { id: 'deploy', title: '部署与运维', icon: Server },
  { id: 'security', title: '安全与合规', icon: Shield },
  { id: 'faq', title: '常见问题', icon: Search },
]

export function DocsView() {
  const [active, setActive] = useState('overview')

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">平台文档</h2>
            <p className="text-sm text-muted-foreground">墨灵写作 · AI 驱动的网文创作平台 · 完整使用与运维指南</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* 侧栏 */}
          <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const isActive = active === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  <span className="flex-1 text-left">{s.title}</span>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </button>
              )
            })}
          </nav>

          {/* 内容区 */}
          <div className="min-w-0 space-y-4">
            {active === 'overview' && <OverviewDoc />}
            {active === 'quickstart' && <QuickStartDoc />}
            {active === 'writing' && <WritingDoc />}
            {active === 'ai' && <AiDoc />}
            {active === 'settings' && <SettingsDoc />}
            {active === 'plaza' && <PlazaDoc />}
            {active === 'billing' && <BillingDoc />}
            {active === 'email' && <EmailDoc />}
            {active === 'api' && <ApiDoc />}
            {active === 'deploy' && <DeployDoc />}
            {active === 'security' && <SecurityDoc />}
            {active === 'faq' && <FaqDoc />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ 通用组件 ============
function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        {children}
      </CardContent>
    </Card>
  )
}

function Code2({ children }: { children: string }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
  )
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono whitespace-pre-wrap">{children}</pre>
  )
}

function Tag({ children, color = 'violet' }: { children: string; color?: string }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-600',
    blue: 'bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
    red: 'bg-red-500/10 text-red-600',
  }
  return <Badge variant="outline" className={`text-[10px] ${colors[color]}`}>{children}</Badge>
}

// ============ 1. 产品概述 ============
function OverviewDoc() {
  return (
    <>
      <DocSection title="平台简介">
        <p><b>墨灵写作</b>是一个 AI 驱动的网文创作平台，集成了 AI 写作辅助、章节管理、设定库、自动连载、作品广场、用户系统、计费支付等完整功能。</p>
        <p>平台名称「墨灵」取自「笔墨 + 灵感」，寓意用 AI 灵感赋能创作。</p>
      </DocSection>

      <DocSection title="技术栈">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><Tag color="blue">前端</Tag> Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui</div>
          <div className="flex items-center gap-2"><Tag color="emerald">数据库</Tag> Prisma ORM + SQLite（可迁移 PostgreSQL/MySQL）</div>
          <div className="flex items-center gap-2"><Tag color="violet">AI</Tag> z-ai-web-dev-sdk（内置）+ 用户自定义第三方 API（DeepSeek/OpenAI/Claude/Gemini/Grok/MiniMax）</div>
          <div className="flex items-center gap-2"><Tag color="amber">支付</Tag> 支付宝电脑网站支付（alipay-sdk）</div>
          <div className="flex items-center gap-2"><Tag color="blue">邮件</Tag> Nodemailer（SMTP，支持 163/QQ/Gmail 等）</div>
          <div className="flex items-center gap-2"><Tag color="violet">后端服务</Tag> Bun 进程（auto-serial mini-service 独立运行）</div>
        </div>
      </DocSection>

      <DocSection title="核心功能清单">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            '✅ 用户注册登录（邮箱验证码 + JWT）',
            '✅ AI 辅助建书（一句话→简介+大纲+角色）',
            '✅ 三栏沉浸式编辑器（打字机/专注/深色/护眼）',
            '✅ 章节/卷/大纲卷树 + 拖拽排序 + 跨卷移动',
            '✅ AI 助手 18 个预设指令 + 流式输出（SSE）',
            '✅ 内联 AI 菜单（润色/扩写/缩写/续写/转文风）',
            '✅ 一键生成整章 + 自动连载（mini-service）',
            '✅ 设定库（角色/世界观/道具）+ AI 自动生成',
            '✅ @ 设定引用 + 长文本记忆引擎',
            '✅ 全文搜索 + 版本历史 + 回滚',
            '✅ 导出（TXT/Markdown/全书 ZIP）',
            '✅ 字数目标 + 创作热力图',
            '✅ 作品广场 + 读者阅读页 + 点赞/收藏',
            '✅ Token 充值（模拟/支付宝真实支付）',
            '✅ 兑换码（独占/通用/自定义 + CSV 导出）',
            '✅ 邮件系统（验证码/通知/群发）',
            '✅ 公告 + 消息群发 + 铃铛弹窗',
            '✅ 回收站 + 数据备份（JSON）',
            '✅ 管理员后台（9 Tab + 文档）',
            '✅ 用户第三方 AI API 接入（6 家）',
          ].map((f, i) => (
            <div key={i} className="text-xs">{f}</div>
          ))}
        </div>
      </DocSection>

      <DocSection title="演示账号">
        <div className="space-y-2 text-sm">
          <p><b>管理员账号</b>（首次访问自动创建）：</p>
          <Pre>{`邮箱：admin@moli.com
密码：admin123
角色：admin
Token：999999
会员：年卡`}</Pre>
          <p className="text-xs text-muted-foreground">管理员可登录后在「用户中心 → 个人资料」修改密码。</p>
        </div>
      </DocSection>
    </>
  )
}

// ============ 2. 快速上手 ============
function QuickStartDoc() {
  return (
    <>
      <DocSection title="环境准备">
        <div className="space-y-2 text-sm">
          <p>1. 安装依赖：</p>
          <Pre>{`bun install`}</Pre>
          <p>2. 配置环境变量（<Code2>.env</Code2> 文件）：</p>
          <Pre>{`DATABASE_URL=file:./db/custom.db

# 支付宝（可选，不配置走模拟支付）
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_SANDBOX=true
NEXT_PUBLIC_BASE_URL=http://localhost:3000`}</Pre>
          <p>3. 初始化数据库：</p>
          <Pre>{`bun run db:push`}</Pre>
          <p>4. 启动开发服务器：</p>
          <Pre>{`bun run dev`}</Pre>
          <p>5. 启动自动连载服务（可选）：</p>
          <Pre>{`cd mini-services/auto-serial && bun run dev`}</Pre>
        </div>
      </DocSection>

      <DocSection title="首次使用流程">
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">1</span>
            <div>
              <b>访问首页</b>：打开 <Code2>http://localhost:3000</Code2>，系统自动创建管理员账号
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">2</span>
            <div>
              <b>登录</b>：使用 <Code2>admin@moli.com</Code2> / <Code2>admin123</Code2> 登录
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">3</span>
            <div>
              <b>配置邮件</b>：管理后台 → 邮箱配置 → 填入 SMTP 信息（用于用户注册验证码）
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">4</span>
            <div>
              <b>创建小说</b>：工作台 → 创建新书 → AI 辅助建书（输入一句话灵感）
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">5</span>
            <div>
              <b>开始写作</b>：编辑器中写作，右侧 AI 助手随时辅助
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">6</span>
            <div>
              <b>开启自动连载</b>：编辑器工具栏 → 开启 → AI 定时生成新章节
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shrink-0">7</span>
            <div>
              <b>发布到广场</b>：编辑器工具栏 → 发布 → 读者可在广场阅读
            </div>
          </div>
        </div>
      </DocSection>
    </>
  )
}

// ============ 3. 写作功能指南 ============
function WritingDoc() {
  return (
    <>
      <DocSection title="编辑器">
        <div className="space-y-3 text-sm">
          <p>编辑器采用三栏可调布局（章节树 / 编辑区 / AI 助手），支持以下功能：</p>
          <div className="space-y-2">
            <div><b>编辑模式</b>：普通模式 / 打字机模式（当前行居中）/ 专注模式 / 深色模式 / 护眼模式（豆沙绿背景）</div>
            <div><b>快捷键</b>：<Code2>Ctrl+B</Code2> 粗体 · <Code2>Ctrl+I</Code2> 斜体 · <Code2>Ctrl+S</Code2> 保存</div>
            <div><b>自动保存</b>：1.5 秒防抖自动保存，显示「保存中 / 已自动保存」状态</div>
            <div><b>字数统计</b>：当前章字数 + 全书总字数 + 预估阅读时长（400字/分钟）</div>
            <div><b>章节状态</b>：草稿 / 待润色 / 已定稿（颜色标识）</div>
            <div><b>@ 设定引用</b>：输入 <Code2>@</Code2> 触发设定搜索，选中后插入 <Code2>【设定名】</Code2>，AI 上下文自动注入</div>
            <div><b>内联 AI 菜单</b>：选中文字弹出菜单（润色/扩写/缩写/续写/转古风/转科幻）</div>
            <div><b>一键生成整章</b>：填入核心事件，AI 生成 2000-3000 字完整章节</div>
          </div>
        </div>
      </DocSection>

      <DocSection title="章节管理">
        <div className="space-y-2 text-sm">
          <div><b>树状结构</b>：卷 → 章，支持无限层级，大纲卷（仅写大纲不写正文）</div>
          <div><b>拖拽排序</b>：章节左侧手柄拖拽，支持同卷排序和跨卷移动</div>
          <div><b>版本历史</b>：手动保存快照 + 回滚（每章最多 30 个版本）</div>
          <div><b>全文搜索</b>：跨章节正文搜索，显示上下文预览和匹配次数</div>
          <div><b>导出</b>：全书 ZIP（按卷分文件夹）/ 单文件 TXT/Markdown / 单章导出</div>
          <div><b>字数目标</b>：设置全书目标字数 + 渐变进度条</div>
          <div><b>回收站</b>：删除小说移入回收站，30 天内可恢复 / 永久删除</div>
        </div>
      </DocSection>

      <DocSection title="自动连载">
        <div className="space-y-2 text-sm">
          <p>独立 Bun 进程（<Code2>mini-services/auto-serial</Code2>），每 30 秒扫描数据库，到时间自动调用 AI 生成下一章。</p>
          <div><b>配置选项</b>：生成间隔（最小 5 分钟）/ 每章字数目标 / 剧情走向提示</div>
          <div><b>上下文注入</b>：小说简介 + 大纲 + 最近 3 章末尾 + 核心角色设定</div>
          <div><b>自动管理</b>：Token 不足自动暂停 / 失败 5 分钟后重试 / 达到最大次数标记完成</div>
          <div><b>状态</b>：空闲 / 生成中 / 已暂停 / 错误（含错误信息）</div>
          <div><b>手动操作</b>：开启/暂停 / 立即生成下一章</div>
        </div>
      </DocSection>
    </>
  )
}

// ============ 4. AI 创作助手 ============
function AiDoc() {
  return (
    <>
      <DocSection title="18 个预设指令">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { cat: '建书', name: 'AI 辅助建书', desc: '一句话→简介+大纲+角色' },
            { cat: '正文', name: '一键生成整章', desc: '核心事件→完整章节' },
            { cat: '正文', name: '黄金三章生成', desc: '为开篇生成抓人的前三章' },
            { cat: '辅助', name: '卡文破局', desc: '3 种剧情走向建议' },
            { cat: '辅助', name: '毒点排查', desc: '检查逻辑漏洞/人设崩塌' },
            { cat: '辅助', name: '起名器', desc: '招式/宗门/法宝名' },
            { cat: '辅助', name: '角色模拟对话', desc: '模拟两角色对话' },
            { cat: '类型', name: '玄幻打斗描写', desc: '热血燃向打斗' },
            { cat: '类型', name: '言情心理描写', desc: '细腻心理活动' },
            { cat: '类型', name: '系统流面板生成', desc: '系统提示面板' },
            { cat: '编辑', name: '润色', desc: '提升文笔流畅度' },
            { cat: '编辑', name: '扩写', desc: '扩展为详细描写' },
            { cat: '编辑', name: '缩写', desc: '压缩篇幅保留核心' },
            { cat: '编辑', name: '转换文风', desc: '古风/科幻等' },
            { cat: '编辑', name: '续写', desc: '续接当前文本' },
            { cat: '设定', name: '设定扩写', desc: '角色小传' },
            { cat: '设定', name: 'AI 生成角色', desc: '类型+关键词→角色卡' },
            { cat: '设定', name: 'AI 批量生成设定', desc: '3角色+2世界观+2道具' },
          ].map((p, i) => (
            <div key={i} className="flex items-start gap-2 p-1.5 bg-muted/30 rounded">
              <Tag color="violet">{p.cat}</Tag>
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="长文本记忆引擎">
        <p className="text-sm">AI 调用时自动注入以下上下文，确保 AI 不失忆：</p>
        <Pre>{`【当前小说】书名 / 类型 / 简介 / 大纲
【当前章节】标题 / 核心事件 / 前文末尾 1500 字
【核心角色】姓名 / 性格 / 背景`}</Pre>
      </DocSection>

      <DocSection title="流式输出（SSE）">
        <p className="text-sm">AI 回复采用 Server-Sent Events 流式传输，逐字显示（打字机效果）：</p>
        <Pre>{`POST /api/ai/stream
Content-Type: application/json

→ 返回 SSE 流：
data: {"delta":"你"}
data: {"delta":"好"}
data: {"done":true,"tokensUsed":3}`}</Pre>
        <p className="text-sm">前端 50ms 节流更新 UI，避免高频渲染卡顿。</p>
      </DocSection>

      <DocSection title="用户自定义 AI API">
        <p className="text-sm">用户可在「用户中心 → AI 模型配置」中绑定自己的 API Key：</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mt-2">
          {['🧠 DeepSeek', '💬 ChatGPT', '🎭 Claude', '✨ Gemini', '🤖 Grok', '📊 MiniMax', '⚙️ 自定义'].map((p) => (
            <div key={p} className="p-2 bg-muted/30 rounded text-center">{p}</div>
          ))}
        </div>
        <p className="text-sm mt-2">设为默认后，所有 AI 写作使用用户配置的 API，<b>不消耗平台 Token</b>。支持流式输出。</p>
      </DocSection>
    </>
  )
}

// ============ 5. 设定库管理 ============
function SettingsDoc() {
  return (
    <>
      <DocSection title="三类设定卡">
        <div className="space-y-2 text-sm">
          <div><Tag color="violet">角色卡</Tag> 姓名 / 头像 / 外貌 / 性格 / 功法 / 背景 / 人物关系</div>
          <div><Tag color="emerald">世界观</Tag> 名称 / 类型（地理/势力/历史）/ 描述</div>
          <div><Tag color="amber">道具/功法</Tag> 名称 / 类型（道具/功法）/ 属性 / 效果</div>
        </div>
      </DocSection>

      <DocSection title="AI 自动生成设定">
        <div className="space-y-2 text-sm">
          <p>设定库页面点击「AI 生成设定」按钮，支持两种模式：</p>
          <div><b>生成单个</b>：选择小说类型 + 输入关键词 → AI 生成完整设定卡并保存</div>
          <div><b>批量生成全套</b>：输入小说类型 + 主题 → AI 一次性生成 3 角色 + 2 世界观 + 2 道具/功法</div>
          <p className="text-xs text-muted-foreground">AI 返回格式化文本，自动解析并创建设定卡。</p>
        </div>
      </DocSection>

      <DocSection title="@ 设定引用">
        <p className="text-sm">在编辑器中输入 <Code2>@</Code2> 触发设定搜索 Popover，选择后插入 <Code2>【设定名】</Code2>。该设定会被 AI 上下文自动注入，确保 AI 写作时了解角色/世界观信息。</p>
      </DocSection>
    </>
  )
}

// ============ 6. 作品广场 ============
function PlazaDoc() {
  return (
    <>
      <DocSection title="作品广场">
        <p className="text-sm">作者可将小说发布到广场，读者可浏览、阅读、点赞、收藏。</p>
        <div className="space-y-2 text-sm">
          <div><b>发布入口</b>：编辑器工具栏 →「发布」按钮</div>
          <div><b>广场功能</b>：搜索 / 分类筛选（10 类）/ 排序（最新/热门/推荐）</div>
          <div><b>阅读页</b>：章节正文 / 上下章切换 / 目录 / 阅读进度自动保存</div>
          <div><b>互动</b>：点赞 / 收藏 / 浏览量统计</div>
          <div><b>管理</b>：发布 / 更新 / 隐藏 / 撤回</div>
        </div>
      </DocSection>

      <DocSection title="数据模型">
        <Pre>{`Publication    — 发布记录（novelId, title, synopsis, viewCount, likeCount）
ReadRecord     — 阅读记录（publicationId, userId, chapterId, 阅读进度）
PublicationLike   — 点赞记录
PublicationCollect — 收藏记录`}</Pre>
      </DocSection>
    </>
  )
}

// ============ 7. 计费与支付 ============
function BillingDoc() {
  return (
    <>
      <DocSection title="Token 积分制">
        <p className="text-sm">平台采用 Token 积分制，所有 AI 操作消耗 Token：</p>
        <Pre>{`注册赠送：10,000 Token
Token 消耗：约 (输入字数 + 输出字数) / 3
估算：1000 字 AI 回复 ≈ 消耗 300-500 Token`}</Pre>
      </DocSection>

      <DocSection title="充值套餐">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><Tag color="amber">入门</Tag> 50,000 Token — ¥9.9</div>
          <div className="flex items-center gap-2"><Tag color="violet">推荐</Tag> 200,000 Token — ¥29.9</div>
          <div className="flex items-center gap-2"><Tag color="blue">深度</Tag> 1,000,000 Token — ¥99.9</div>
        </div>
      </DocSection>

      <DocSection title="会员订阅">
        <div className="space-y-2 text-sm">
          <div><b>免费版</b>：每日 5,000 Token / 基础 AI / 最多 3 部小说</div>
          <div><b>月卡 ¥29.9/月</b>：每日 50,000 Token / 高级 AI / 无限小说 / 赠 50,000 Token</div>
          <div><b>年卡 ¥299/年</b>：月卡全部权益 / 每日 200,000 Token / 赠 500,000 Token</div>
        </div>
      </DocSection>

      <DocSection title="支付方式">
        <div className="space-y-2 text-sm">
          <p><b>模拟支付</b>（默认）：点击购买后弹窗确认，无需真实扣款。适用于演示/开发环境。</p>
          <p><b>支付宝真实支付</b>：在 <Code2>.env</Code2> 中配置支付宝密钥后自动启用：</p>
          <Pre>{`ALIPAY_APP_ID=你的APPID
ALIPAY_PRIVATE_KEY=应用私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
ALIPAY_SANDBOX=true  # 沙箱测试`}</Pre>
          <p>支付流程：创建订单 → 跳转支付宝 → 用户支付 → 异步回调验签 → Token 到账</p>
        </div>
      </DocSection>

      <DocSection title="兑换码">
        <div className="space-y-2 text-sm">
          <div><b>独占码</b>：一码一人，用后即止</div>
          <div><b>通用码</b>：一码多人，每人限一次（支持最大使用次数）</div>
          <div><b>自定义码</b>：管理员手动指定 code（如 WELCOME2024）</div>
          <div><b>奖励类型</b>：Token 余额 / 会员权益（月卡/年卡）</div>
          <div><b>管理功能</b>：批量生成 / CSV 导出 / 禁用/启用 / 单个删除 / 批次管理 / 过期时间</div>
        </div>
      </DocSection>
    </>
  )
}

// ============ 8. 邮件系统 ============
function EmailDoc() {
  return (
    <>
      <DocSection title="SMTP 配置">
        <p className="text-sm">管理员在「管理后台 → 邮箱配置」中设置 SMTP：</p>
        <div className="space-y-1 text-xs mt-2">
          <div>支持 7 种预设：163 / 126 / QQ / Gmail / Outlook / 阿里云企业 / 腾讯企业</div>
          <div>SSL (465) / STARTTLS (587) 切换</div>
          <div>测试邮件发送 + 状态记录</div>
          <div>启用/禁用切换</div>
        </div>
      </DocSection>

      <DocSection title="163 邮箱注意事项">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded p-3 text-xs space-y-1">
          <p><b>⚠ 163 邮箱必须使用「客户端授权码」，而非邮箱登录密码！</b></p>
          <p>1. 登录 163 邮箱网页版</p>
          <p>2. 设置 → POP3/SMTP/IMAP → 开启 SMTP 服务</p>
          <p>3. 在「客户端授权密码」中生成授权码（16 位字母）</p>
          <p>4. 在墨灵写作后台填入授权码（不是登录密码）</p>
        </div>
      </DocSection>

      <DocSection title="邮件用途">
        <div className="space-y-1 text-sm">
          <div>📧 <b>注册验证码</b>：用户注册时发送 6 位验证码（10 分钟有效）</div>
          <div>📧 <b>兑换成功通知</b>：兑换码成功后发送奖励详情 + 账户变化</div>
          <div>📧 <b>公告通知</b>：发布公告时可选择邮件通知所有/付费/免费用户</div>
          <div>📧 <b>消息群发</b>：管理员群发消息时可选择邮件通知</div>
        </div>
      </DocSection>
    </>
  )
}

// ============ 9. API 文档 ============
function ApiDoc() {
  return (
    <>
      <DocSection title="API 路由总览（35+ 路由）">
        <div className="space-y-1 text-xs">
          {[
            ['认证', '/api/auth/{login,logout,register,me,send-code,verify-code}'],
            ['小说', '/api/novels (GET/POST/PATCH/DELETE) + ?trash=true 回收站 + ?restore=true 恢复'],
            ['章节', '/api/chapters (GET/POST/PATCH/DELETE) + /api/chapters/revisions 版本历史'],
            ['设定库', '/api/characters?type=character|worldview|item (GET/POST/PATCH/DELETE)'],
            ['AI', '/api/ai (GET预设/POST调用) + /api/ai/stream (SSE流式)'],
            ['搜索', '/api/search?q=关键词&novelId=xxx'],
            ['导出', '/api/export (txt/md) + /api/export/zip (全书ZIP)'],
            ['自动连载', '/api/auto-serial (GET/POST/PATCH)'],
            ['广场', '/api/plaza (公开) + /api/plaza/[id] + /api/plaza/{read,like,collect}'],
            ['订单', '/api/orders (GET/POST/PATCH模拟支付)'],
            ['支付', '/api/payment/status + /api/payment/alipay/{create,notify,return}'],
            ['兑换码', '/api/redeem (POST兑换/GET历史) + /api/admin/redeem-codes'],
            ['用户', '/api/user (GET/PATCH) + /api/user/ai-config (CRUD+test)'],
            ['公告', '/api/announcements (GET/POST已读)'],
            ['消息', '/api/messages (GET/POST已读/DELETE)'],
            ['管理后台', '/api/admin/{users,novels,orders,ai-logs,stats,messages,announcements,email-config,redeem-codes,backup}'],
          ].map(([cat, routes], i) => (
            <div key={i} className="flex gap-2">
              <Tag color="blue">{cat}</Tag>
              <code className="text-[10px]">{routes}</code>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="鉴权机制">
        <div className="space-y-2 text-sm">
          <p><b>JWT + HttpOnly Cookie</b>：</p>
          <Pre>{`// 登录返回 Set-Cookie: token=xxx; HttpOnly; SameSite=Lax; Max-Age=2592000
// 所有 API 自动携带 Cookie（credentials: same-origin）
// 后端通过 requireSessionOr401() 验证
// 管理员接口通过 requireAdminOr401() 验证 role === 'admin'`}</Pre>
          <p><b>密码哈希</b>：scrypt + 随机 salt（16 字节）+ 64 字节哈希</p>
        </div>
      </DocSection>

      <DocSection title="AI 调用示例">
        <Pre>{`// 非流式
POST /api/ai
{
  "action": "chat",
  "preset": "chapter_gen",
  "message": "主角在森林中遭遇追杀",
  "novelId": "xxx",
  "chapterId": "xxx"
}
→ { "reply": "...", "tokensUsed": 500 }

// 流式
POST /api/ai/stream
（同上 body）
→ SSE: data: {"delta":"林"}
  data: {"delta":"辰"}
  data: {"done":true}`}</Pre>
      </DocSection>
    </>
  )
}

// ============ 10. 部署与运维 ============
function DeployDoc() {
  return (
    <>
      <DocSection title="生产环境部署">
        <Pre>{`# 1. 构建生产版本
bun run build

# 2. 配置生产环境变量
# .env 中设置：
#   ALIPAY_SANDBOX=false
#   NEXT_PUBLIC_BASE_URL=https://your-domain.com

# 3. 启动生产服务器
bun run start

# 4. 启动自动连载服务
cd mini-services/auto-serial && bun run dev`}</Pre>
      </DocSection>

      <DocSection title="数据库管理">
        <div className="space-y-2 text-sm">
          <Pre>{`bun run db:push      # 推送 schema 变更
bun run db:generate  # 重新生成 Prisma Client
bun run db:migrate   # 创建迁移
bun run db:reset     # 重置数据库（慎用）`}</Pre>
          <p><b>数据库备份</b>：管理后台 → 总览 → 数据备份 → 全量/作品/用户/订单/设定库 JSON 导出</p>
          <p className="text-xs text-muted-foreground">SQLite 数据库文件位于 <Code2>db/custom.db</Code2>，可直接复制备份。</p>
        </div>
      </DocSection>

      <DocSection title="Caddy 网关配置">
        <p className="text-sm">项目内置 Caddyfile 网关配置：</p>
        <Pre>{`# 外部只暴露一个端口
# API 请求通过 XTransformPort 参数转发到不同服务
# WebSocket 路径必须为 /，通过 XTransformPort 指定端口

# 示例：
fetch('/api/test?XTransformPort=3030')  # 转发到 3030 端口
io('/?XTransformPort=3003')              # WebSocket 连接`}</Pre>
      </DocSection>

      <DocSection title="mini-service 管理">
        <div className="space-y-2 text-sm">
          <p><b>auto-serial 服务</b>（独立 Bun 进程）：</p>
          <Pre>{`cd mini-services/auto-serial
bun run dev    # 开发模式（热重载）
bun run start  # 生产模式`}</Pre>
          <p className="text-xs">每 30 秒扫描数据库，发现到期的自动连载任务自动执行。</p>
        </div>
      </DocSection>
    </>
  )
}

// ============ 11. 安全与合规 ============
function SecurityDoc() {
  return (
    <>
      <DocSection title="认证安全">
        <div className="space-y-2 text-sm">
          <div>✅ JWT 签名（HMAC-SHA256，30 天有效期）</div>
          <div>✅ HttpOnly Cookie（防 XSS 窃取）</div>
          <div>✅ scrypt 密码哈希（随机 salt + 64 字节）</div>
          <div>✅ 时序安全比较（防时序攻击）</div>
          <div>✅ 注册邮箱验证码（6 位，10 分钟有效，60 秒频率限制）</div>
          <div>✅ 用户封禁机制（banned 字段）</div>
          <div>✅ 管理员角色分离（role: user/admin）</div>
        </div>
      </DocSection>

      <DocSection title="支付安全">
        <div className="space-y-2 text-sm">
          <div>✅ RSA2 签名验签（防伪造回调）</div>
          <div>✅ 金额校验（防篡改）</div>
          <div>✅ 防重复到账（幂等处理）</div>
          <div>✅ 数据库事务（订单 + Token 原子操作）</div>
          <div>✅ 沙箱/正式环境切换</div>
        </div>
      </DocSection>

      <DocSection title="API 安全">
        <div className="space-y-2 text-sm">
          <div>✅ 所有 API 需登录（requireSessionOr401）</div>
          <div>✅ 管理员 API 需 admin 角色（requireAdminOr401）</div>
          <div>✅ 数据隔离（用户只能访问自己的数据）</div>
          <div>✅ Token 余额检查（AI 调用前检查余额）</div>
          <div>✅ 邮件验证码频率限制（60 秒）</div>
          <div>✅ 第三方 API Key 安全存储（UI 只显示后 4 位）</div>
        </div>
      </DocSection>

      <DocSection title="数据安全">
        <div className="space-y-2 text-sm">
          <div>✅ 软删除回收站（30 天恢复期）</div>
          <div>✅ 版本历史（每章最多 30 个快照）</div>
          <div>✅ 数据备份（JSON 全量导出）</div>
          <div>✅ 操作日志（AI 调用记录 + 兑换历史）</div>
          <div className="text-amber-600">⚠ 待实现：内容审核（敏感词过滤）</div>
          <div className="text-amber-600">⚠ 待实现：2FA 二次验证</div>
          <div className="text-amber-600">⚠ 待实现：操作审计日志</div>
        </div>
      </DocSection>
    </>
  )
}

// ============ 12. 常见问题 ============
function FaqDoc() {
  return (
    <>
      <DocSection title="AI 相关">
        <div className="space-y-3 text-sm">
          <div>
            <b>Q: AI 回复很慢怎么办？</b>
            <p>使用用户自定义 API（用户中心 → AI 模型配置），绑定 DeepSeek 等国内 API 可显著提升速度。平台内置 AI 速度取决于网络。</p>
          </div>
          <div>
            <b>Q: AI 回复内容不相关？</b>
            <p>确保小说有简介和大纲（编辑器工具栏 → 字数目标旁可编辑），AI 会自动注入这些上下文。在编辑器中输入 @ 可引用设定。</p>
          </div>
          <div>
            <b>Q: Token 消耗太快？</b>
            <p>1. 绑定自己的 AI API Key（不消耗平台 Token）；2. 使用兑换码获取 Token；3. 升级会员获得每日额度。</p>
          </div>
          <div>
            <b>Q: 自动连载不工作？</b>
            <p>检查：1. mini-service 是否在运行（<Code2>cd mini-services/auto-serial && bun run dev</Code2>）；2. Token 余额是否充足；3. 任务状态是否为 idle/error。</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="支付相关">
        <div className="space-y-3 text-sm">
          <div>
            <b>Q: 支付后 Token 没到账？</b>
            <p>真实支付：等待 5-10 秒后刷新用户中心（支付宝异步回调可能有延迟）。模拟支付：点击弹窗中的「确认支付」按钮。</p>
          </div>
          <div>
            <b>Q: 如何启用真实支付？</b>
            <p>在 <Code2>.env</Code2> 文件中填入 <Code2>ALIPAY_APP_ID</Code2>、<Code2>ALIPAY_PRIVATE_KEY</Code2>、<Code2>ALIPAY_PUBLIC_KEY</Code2>，重启服务即可。</p>
          </div>
          <div>
            <b>Q: 沙箱测试怎么操作？</b>
            <p>1. 在 open.alipay.com 注册开发者；2. 进入沙箱环境获取密钥；3. 填入 .env（<Code2>ALIPAY_SANDBOX=true</Code2>）；4. 用沙箱买家账号扫码支付（不真实扣款）。</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="邮件相关">
        <div className="space-y-3 text-sm">
          <div>
            <b>Q: 注册验证码收不到？</b>
            <p>1. 检查管理后台 → 邮箱配置是否正确；2. 163 邮箱必须用授权码不是密码；3. 点击「发送测试邮件」验证；4. 检查垃圾邮件箱。</p>
          </div>
          <div>
            <b>Q: 不想配置邮件，怎么测试注册？</b>
            <p>目前注册必须验证码。可以：1. 管理员后台直接创建用户；2. 配置邮件后再测试。</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="运维相关">
        <div className="space-y-3 text-sm">
          <div>
            <b>Q: 数据库重置后数据丢了？</b>
            <p><Code2>db:push --force-reset</Code2> 会清空数据。建议操作前先在管理后台导出备份。</p>
          </div>
          <div>
            <b>Q: 如何迁移到 PostgreSQL？</b>
            <p>1. 修改 <Code2>prisma/schema.prisma</Code2> 中 datasource provider 为 postgresql；2. 修改 <Code2>.env</Code2> 中 DATABASE_URL；3. 运行 <Code2>bun run db:push</Code2>。</p>
          </div>
          <div>
            <b>Q: dev server 频繁崩溃？</b>
            <p>可能是内存不足。用 <Code2>bash .zscripts/dev.sh</Code2> 启动（自带进程管理），或检查 <Code2>dev.log</Code2> 日志。</p>
          </div>
        </div>
      </DocSection>
    </>
  )
}
