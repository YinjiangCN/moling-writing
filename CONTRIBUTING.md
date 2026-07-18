# 贡献指南 | Contributing Guide

感谢你对墨灵写作项目的兴趣！欢迎提交 Issue 和 Pull Request。

## 🐛 提交 Bug 报告

提交 Bug 前请先搜索现有 Issue，避免重复。Bug 报告请包含：

1. **环境信息**：操作系统、Node/Bun 版本、浏览器
2. **复现步骤**：详细描述如何触发问题
3. **预期行为**：你期望发生什么
4. **实际行为**：实际发生了什么
5. **截图/日志**：如有请附上

## ✨ 提交功能建议

欢迎提出新功能建议！请描述：

1. **功能描述**：这个功能做什么
2. **使用场景**：什么情况下需要
3. **参考示例**：其他产品的类似功能（如有）

## 🔧 开发流程

### 环境准备

```bash
git clone https://github.com/YinjiangCN/moling-writing.git
cd moling-writing
bun install
cp .env.example .env
bun run db:push
bun run dev
```

### 代码规范

- 使用 TypeScript（严格模式）
- 使用 ESLint 检查代码质量（`bun run lint`）
- 遵循现有代码风格（shadcn/ui + Tailwind CSS）
- 提交前确保 `bun run lint` 无错误

### 提交 PR

1. Fork 仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: 添加 XXX 功能"`
4. 推送：`git push origin feature/your-feature`
5. 创建 Pull Request

### Commit 规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 📋 开发计划

以下功能欢迎贡献：

- [ ] 内容审核（敏感词过滤）
- [ ] 微信支付接入
- [ ] PWA / 移动端适配
- [ ] 富文本编辑器（mdx-editor 集成）
- [ ] 人物关系图谱可视化
- [ ] 时间线/事件线管理
- [ ] 伏笔追踪系统
- [ ] 创作模板库
- [ ] 多端同步
- [ ] 2FA 二次验证

## 📄 License

提交的代码将遵循 [MIT License](./LICENSE)。
