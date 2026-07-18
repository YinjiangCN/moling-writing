# GitHub 仓库设置指南

## 1. 仓库描述
```
墨灵写作 — AI 驱动的网文创作平台 | AI-Powered Novel Writing Platform
```

## 2. Topics（标签）
在仓库页面右上角齿轮 → Topics 添加：
- ai-writing
- novel
- web-novel
- nextjs
- react
- typescript
- tailwindcss
- prisma
- alipay
- deepseek
- openai
- claude
- gemini
- writing-platform
- ai-assistant

## 3. 社交预览图
创建一张 1280×640 的社交预览图（og:image），放在仓库根目录或 docs/ 中。
建议包含：项目 Logo + 标题 + 核心功能关键词。

## 4. 开启功能
Settings → General:
- ✅ Issues
- ✅ Discussions（社区讨论）
- ✅ Projects
- ✅ Wiki

## 5. 分支保护
Settings → Branches → Add rule:
- Branch name: main
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (CI lint)

## 6. Pages（可选）
Settings → Pages → Source: GitHub Actions
可部署演示站点。

## 7. Releases
创建 v1.0.0 Release，附上功能列表和截图。
