# 墨灵写作 | MoLing Writing

[English](./README_EN.md) | [简体中文](./README.md) | [日本語](./README_JA.md) | [한국어](./README_KO.md) | [Español](./README_ES.md) | [Français](./README_FR.md) | [Deutsch](./README_DE.md) | [Português](./README_PT.md) | [Русский](./README_RU.md) | [العربية](./README_AR.md)

---

> 🖊️ AI 驱动的网文创作平台 — 集写作、AI 辅助、设定管理、自动连载、作品广场、支付系统于一体

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo)](https://www.prisma.io/)
[![Bun](https://img.shields.io/badge/Bun-1-f472b6)](https://bun.sh/)

## 📊 项目规模

| 指标 | 数量 |
|------|------|
| 代码行数 | 22,700+ 行 |
| TypeScript 文件 | 127 个 |
| API 路由 | 47 个 |
| 数据库模型 | 28 个 |
| AI 预设指令 | 18 个 |
| 管理后台 Tab | 10 个 |
| 支持 AI 提供商 | 6 家 |
| README 语言 | 10 种 |

## ✨ 核心功能

### 📝 写作引擎
- **三栏沉浸式编辑器** — 章节树 / 编辑区 / AI 助手，可调宽度
- **4 种编辑模式** — 普通 / 打字机 / 专注 / 深色 / 护眼
- **章节拖拽排序** — 同卷排序 + 跨卷移动（dnd-kit）
- **版本历史** — 手动快照 + 回滚（每章 30 个版本）
- **全文搜索** — 跨章节正文搜索，上下文预览
- **导出** — TXT / Markdown / 全书 ZIP（按卷分文件夹）
- **字数目标** — 进度条 + 达成提醒
- **回收站** — 软删除 + 30 天恢复
- **快捷键** — Ctrl+B 粗体 / Ctrl+I 斜体 / Ctrl+S 保存

### 🤖 AI 创作助手
- **18 个预设指令** — 建书 / 正文 / 辅助 / 类型 / 编辑 / 设定 6 大类
- **流式输出（SSE）** — 打字机效果，逐字显示
- **长文本记忆引擎** — 自动注入世界观 + 大纲 + 前情 + 角色
- **内联 AI 菜单** — 选中文字 → 润色 / 扩写 / 缩写 / 续写 / 转文风
- **一键生成整章** — 输入核心事件 → AI 写出 2000-3000 字
- **自动连载** — 独立 Bun 进程，定时 AI 生成新章节
- **@ 设定引用** — 编辑器内输入 @ 触发设定搜索
- **第三方 API 接入** — DeepSeek / OpenAI / Claude / Gemini / Grok / MiniMax

### 📚 设定库
- **三类设定卡** — 角色 / 世界观 / 道具功法
- **AI 自动生成** — 单个生成 + 批量生成全套（3角色+2世界观+2道具）
- **AI 角色小传** — 关键词 → 完整背景故事

### 🌐 作品广场
- **公开发布** — 作者可将小说发布到广场
- **读者阅读页** — 章节阅读 / 上下章 / 目录 / 阅读进度
- **互动系统** — 点赞 / 收藏 / 浏览量
- **搜索筛选** — 关键词搜索 + 10 分类 + 排序

### 💳 计费与支付
- **Token 积分制** — AI 操作消耗 Token
- **支付宝接入** — 沙箱 + 正式环境，RSA2 验签
- **兑换码系统** — 独占码 / 通用码 / 自定义码 + CSV 导出
- **会员订阅** — 月卡 / 年卡

### 📧 邮件系统
- **SMTP 配置** — 支持 163 / QQ / Gmail / Outlook 等 7 种预设
- **注册验证码** — 6 位验证码，10 分钟有效
- **通知邮件** — 兑换成功 / 公告 / 消息群发

### 👨‍💼 管理员后台（10 个 Tab）
- 总览 / 用户 / 作品 / 订单 / AI日志 / 公告 / 群发 / 邮箱配置 / 兑换码 / 文档
- 数据备份（JSON 全量导出）

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui |
| 数据库 | Prisma ORM + SQLite（可迁移 PostgreSQL/MySQL）|
| AI | z-ai-web-dev-sdk + 用户自定义第三方 API |
| 支付 | 支付宝 alipay-sdk |
| 邮件 | Nodemailer (SMTP) |
| 后端服务 | Bun 进程（auto-serial mini-service）|
| 状态管理 | Zustand + TanStack Query |

## 📁 项目结构

```
moling-writing/
├── prisma/
│   └── schema.prisma              # 28 个数据库模型
├── src/
│   ├── app/
│   │   ├── api/                   # 47 个 API 路由
│   │   │   ├── auth/              # 认证（登录/注册/验证码）
│   │   │   ├── novels/            # 小说 CRUD + 回收站
│   │   │   ├── chapters/          # 章节 + 版本历史
│   │   │   ├── ai/                # AI 调用（普通+流式）
│   │   │   ├── plaza/             # 作品广场
│   │   │   ├── payment/           # 支付宝支付
│   │   │   ├── admin/             # 管理员后台 API
│   │   │   └── ...
│   │   ├── page.tsx               # 主页面
│   │   └── layout.tsx             # 布局
│   ├── components/
│   │   ├── editor/                # 编辑器（三栏/章节树/工具栏）
│   │   ├── workspace/             # 工作台
│   │   ├── ai/                    # AI 助手
│   │   ├── admin/                 # 管理后台（10 Tab）
│   │   ├── plaza/                 # 作品广场
│   │   ├── user/                  # 用户中心
│   │   ├── auth/                  # 登录注册
│   │   └── settings/              # 设定库
│   └── lib/
│       ├── auth.ts                # JWT + scrypt 鉴权
│       ├── ai-providers.ts        # 6 家 AI 提供商配置
│       ├── payment.ts             # 支付宝配置
│       ├── email.ts               # 邮件系统
│       ├── redeem.ts              # 兑换码
│       └── store.ts               # Zustand 状态
├── mini-services/
│   └── auto-serial/               # 自动连载独立服务
├── .github/
│   ├── ISSUE_TEMPLATE/            # Issue 模板
│   └── workflows/ci.yml           # GitHub Actions CI
├── .env.example                   # 环境变量模板
├── LICENSE                        # MIT 协议
├── CONTRIBUTING.md                # 贡献指南
└── README.md                      # 你正在看的这个
```

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/YinjiangCN/moling-writing.git
cd moling-writing

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入必要配置

# 4. 初始化数据库
bun run db:push

# 5. 启动开发服务器
bun run dev

# 6.（可选）启动自动连载服务
cd mini-services/auto-serial && bun run dev
```

打开 `http://localhost:3000`，系统自动创建管理员账号：
- 邮箱：`admin@moli.com`
- 密码：`admin123`

## 📖 文档

管理员后台内置完整平台文档（12 个章节），登录后进入「管理后台 → 文档」查看。

## 🗺️ 功能路线图

### ✅ 已完成
- [x] 三栏沉浸式编辑器 + 4 种模式
- [x] AI 助手 18 预设 + 流式输出
- [x] 自动连载 mini-service
- [x] 设定库 + AI 自动生成
- [x] 作品广场 + 读者阅读页
- [x] 支付宝支付接入
- [x] 兑换码系统
- [x] 邮件系统
- [x] 管理员后台 10 Tab
- [x] 第三方 AI API 接入（6 家）
- [x] 版本历史 + 回滚
- [x] 全文搜索
- [x] 导出（TXT/MD/ZIP）
- [x] 回收站 + 数据备份

### 🔜 计划中
- [ ] 内容审核（敏感词过滤）
- [ ] 微信支付接入
- [ ] PWA / 移动端适配
- [ ] 富文本编辑器
- [ ] 人物关系图谱可视化
- [ ] 时间线/事件线管理
- [ ] 伏笔追踪系统
- [ ] 创作模板库
- [ ] 多端同步
- [ ] 2FA 二次验证

## 🤝 贡献

欢迎提交 Issue 和 PR！请阅读 [贡献指南](./CONTRIBUTING.md)。

## 📄 License

[MIT License](./LICENSE) — 自由使用、修改、分发

Copyright © 2026 [YinjiangCN](https://github.com/YinjiangCN)
