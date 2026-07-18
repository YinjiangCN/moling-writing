# MoLing Writing | 墨灵写作

[简体中文](./README.md) | [English](./README_EN.md) | [日本語](./README_JA.md) | [한국어](./README_KO.md) | [Español](./README_ES.md) | [Français](./README_FR.md) | [Deutsch](./README_DE.md) | [Português](./README_PT.md) | [Русский](./README_RU.md) | [العربية](./README_AR.md)

---

> 🖊️ AI-Powered Novel Writing Platform — Writing, AI Assistance, World-Building, Auto-Serialization, Publication Plaza, and Payment System in One

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo)](https://www.prisma.io/)

## ✨ Key Features

### 📝 Writing Engine
- **Three-Panel Immersive Editor** — Chapter tree / Edit area / AI assistant, resizable
- **4 Edit Modes** — Normal / Typewriter / Focus / Dark / Eye-care
- **Drag & Drop Chapters** — Reorder within volume + move across volumes (dnd-kit)
- **Version History** — Manual snapshots + rollback (30 per chapter)
- **Full-text Search** — Cross-chapter search with context preview
- **Export** — TXT / Markdown / Full-book ZIP (organized by volume folders)
- **Word Count Goals** — Progress bar + achievement alerts
- **Recycle Bin** — Soft delete + 30-day recovery

### 🤖 AI Writing Assistant
- **18 Preset Commands** — 6 categories: Book creation / Content / Helpers / Genre / Editing / Settings
- **Streaming Output (SSE)** — Typewriter effect, character-by-character display
- **Long-text Memory Engine** — Auto-injects worldview + outline + context + characters
- **Inline AI Menu** — Select text → Polish / Expand / Shorten / Continue / Change style
- **One-click Chapter Generation** — Input core event → AI writes 2000-3000 words
- **Auto-Serialization** — Standalone Bun process, scheduled AI chapter generation
- **@ Setting References** — Type @ in editor to trigger setting search
- **Third-party API Integration** — DeepSeek / OpenAI / Claude / Gemini / Grok / MiniMax

### 📚 World-Building Library
- **Three Card Types** — Characters / Worldview / Items & Skills
- **AI Auto-Generation** — Single generation + batch generation (3 chars + 2 worldviews + 2 items)
- **AI Character Backstory** — Keywords → Complete background story

### 🌐 Publication Plaza
- **Public Publishing** — Authors can publish novels to the plaza
- **Reader Page** — Chapter reading / navigation / TOC / reading progress
- **Interaction** — Likes / Bookmarks / View counts
- **Search & Filter** — Keyword search + 10 categories + sorting

### 💳 Billing & Payment
- **Token Credit System** — AI operations consume tokens
- **Alipay Integration** — Sandbox + production, RSA2 signature verification
- **Redemption Codes** — Exclusive / Universal / Custom + CSV export
- **Membership** — Monthly / Yearly plans

### 📧 Email System
- **SMTP Configuration** — Supports 163 / QQ / Gmail / Outlook and 7 presets
- **Registration Verification** — 6-digit code, 10-minute validity
- **Notification Emails** — Redemption success / Announcements / Message broadcasts

### 👨‍💼 Admin Dashboard (10 Tabs)
- Overview / Users / Novels / Orders / AI Logs / Announcements / Broadcast / Email Config / Redemption Codes / Docs
- Data Backup (JSON full export)

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite (migratable to PostgreSQL/MySQL) |
| AI | z-ai-web-dev-sdk + User-configured third-party APIs |
| Payment | Alipay alipay-sdk |
| Email | Nodemailer (SMTP) |
| Backend Service | Bun process (auto-serial mini-service) |
| State | Zustand + TanStack Query |

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/moling-writing.git
cd moling-writing

# 2. Install
bun install

# 3. Configure
cp .env.example .env

# 4. Database
bun run db:push

# 5. Run
bun run dev

# 6. (Optional) Auto-serial service
cd mini-services/auto-serial && bun run dev
```

Open `http://localhost:3000`. Admin account is auto-created:
- Email: `admin@moli.com`
- Password: `admin123`

## 📄 License

[MIT License](./LICENSE)
