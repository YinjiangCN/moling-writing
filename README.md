# 墨灵写作 | MoLing Writing

[English](./README_EN.md) | [简体中文](./README.md) | [日本語](./README_JA.md) | [한국어](./README_KO.md) | [Español](./README_ES.md) | [Français](./README_FR.md) | [Deutsch](./README_DE.md) | [Português](./README_PT.md) | [Русский](./README_RU.md) | [العربية](./README_AR.md)

---

> 🖊️ AI 驱动的网文创作平台 — 集写作、AI 辅助、设定管理、自动连载、作品广场、支付系统于一体

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo)](https://www.prisma.io/)

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

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/moling-writing.git
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

## 📸 截图

> 截图可在 `download/` 目录找到，部署后可替换为实际 URL

## 🤝 贡献

欢迎提交 Issue 和 PR！请阅读 [贡献指南](./CONTRIBUTING.md)。

## 📄 License

[MIT License](./LICENSE) — 自由使用、修改、分发
