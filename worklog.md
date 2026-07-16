# 墨灵写作 - AI 写小说平台 工作日志

---
Task ID: main
Agent: 主 Agent (fullstack-dev)
Task: 开发一个接入 AI 写小说的网站，包含工作台/章节管理/设定库/编辑器/AI助手/用户中心等 7 大模块

Work Log:
- 初始化 fullstack-dev 环境（Next.js 16 + TypeScript + Tailwind + Prisma + shadcn/ui）
- 设计 Prisma schema：User、Folder、Novel、Volume、Chapter、Character、Worldview、Item、ChatMessage、DailyStat
- 创建 API 路由：/api/folders, /api/novels, /api/chapters, /api/characters（同时服务 worldview/item）, /api/ai（含 14 个预设指令库）, /api/user
- 集成 z-ai-web-dev-sdk 实现 AI 调用，自动注入"世界观+大纲+前情提要+当前正文"上下文（长文本记忆引擎）
- 构建 Zustand 全局状态管理（视图切换、当前小说/章节、编辑器模式、主题）
- 实现工作台：数据看板（今日字数/总字数/作品数/Token 余额）+ 35 天创作热力图 + 文件夹侧栏 + 小说卡片网格
- 实现小说创建向导：AI 辅助建书（一句话灵感→简介+大纲+角色）/ 手动填写两种模式
- 实现三栏可调编辑器：章节树（卷-章-节，支持大纲卷）+ 沉浸式编辑器（打字机/深色/护眼模式）+ AI 助手对话
- 编辑器内联 AI 菜单：选中文字触发润色/扩写/缩写/续写/转换文风（古风/科幻）
- 一键生成整章：填入核心事件，AI 自动生成 2000-3000 字章节正文
- 设定库模块：角色卡 / 世界观 / 道具卡，支持 AI 生成角色小传
- 用户中心：年度热力图 + Token 充值模拟 + 月卡/年卡会员升级 + 高级功能预告
- 全部使用 shadcn/ui 组件，响应式布局，支持深色/护眼主题
- 通过 ESLint 检查
- Agent Browser 端到端验证：
  * 工作台正常加载，显示空状态引导
  * 创建向导：AI 生成简介+大纲+角色成功（耗时约 28 秒）
  * 小说创建后自动进入编辑器，章节树正常显示
  * 一键生成整章：AI 生成 3240 字正文（耗时约 101 秒）
  * 预设指令库：14 个预设正常显示
  * 设定库、用户中心导航正常
  * 深色模式切换正常

Stage Summary:
- 已交付完整的 AI 写小说平台 MVP，覆盖用户原始 7 大模块中的核心场景
- 实际验证 AI 端到端工作正常，可创建小说、生成章节、编辑保存
- 已知限制：AI 调用较慢（10-100 秒），社区广场模块、回收站、版本历史、导入导出等作为"即将上线"功能展示
- 文件结构：
  * prisma/schema.prisma - 10 个数据模型
  * src/app/api/* - 6 个 API 路由模块
  * src/lib/store.ts - Zustand 状态
  * src/lib/helpers.ts - 工具函数
  * src/components/{layout,workspace,editor,settings,user,ai}/ - 6 大组件模块
  * src/app/page.tsx + layout.tsx - 入口

---
Task ID: extend-1
Agent: 主 Agent (fullstack-dev)
Task: 扩展三大功能：AI 自动连载、用户注册登录与充值、管理员后台

Work Log:
- 扩展 Prisma schema：User 加 password/role/banned 字段，新增 Order（充值订单）和 AutoSerial（自动连载任务）模型
- 创建 src/lib/auth.ts：JWT 签发/验证、scrypt 密码哈希、getSession/requireSession/requireAdmin 工具函数
- 创建 /api/auth/{register,login,logout,me} 路由，预置管理员账号 admin@moli.com/admin123
- 改造所有现有 API（folders/novels/chapters/characters/ai/user）使用真实 session，未登录返回 401
- AI API 加入 Token 余额检查，余额不足返回 402
- 创建订单系统 API /api/orders（创建订单 + 模拟支付 PATCH 自动到账 Token）
- 前端 store 扩展：增加 user/authLoading 状态、login/register/admin 视图
- 创建登录注册页 AuthView：双 Tab、邮箱密码、注册赠送 10000 Token、一键填入管理员账号
- TopBar 改造：未登录显示「登录/注册」按钮、已登录显示头像下拉菜单（用户中心/管理后台/退出）
- page.tsx 路由保护：未登录跳转到 AuthView，admin 视图仅 admin 角色可访问
- 用户中心接入订单系统：充值套餐列表 + 模拟支付对话框（支付宝/微信/银行卡）+ 充值记录表格
- AI 助手处理 401（提示重新登录）和 402（提示充值）错误
- 创建 AI 自动连载 API /api/auto-serial：GET/POST/PATCH（开启/暂停/立即触发/配置）
- 创建 mini-services/auto-serial 独立服务：每 30 秒扫描数据库，到时间的任务调用 AI 生成下一章
  - 自动注入小说上下文（简介/大纲/最近3章末尾/角色设定）
  - 解析 AI 返回的标题和正文，保存为新章节（autoGen=true 标记）
  - 自动扣 Token、记录 ChatMessage、更新小说总字数
  - Token 不足时自动暂停并标记错误
- 编辑器工具栏集成 AutoSerialPanel：状态 Badge（空闲/生成中/已暂停/错误）+ 开启/暂停按钮 + 立即生成按钮 + 设置对话框（间隔/字数/剧情走向）
- 创建管理员后台 API /api/admin/{users,novels,orders,messages,stats}（全部 requireAdmin）
- 创建管理员后台前端 AdminView（5 个 Tab）：
  - 总览：9 个数据卡片 + 近 7 天新增趋势条形图
  - 用户：表格 + 搜索 + 调 Token/封禁/设管理员
  - 作品：卡片网格 + 搜索
  - 订单：表格 + 总收入/总订单数统计
  - AI日志：消息列表 + Token 消耗统计
- ESLint 通过
- Agent Browser 端到端验证：
  * 未登录显示登录页，可使用演示管理员账号一键填入
  * 登录成功跳转到管理后台，显示 999,999 Token
  * 注册新用户 writer@test.com 成功赠送 10000 Token
  * 用户管理 Tab 显示所有用户，含搜索/调Token/封禁/设管理员按钮
  * 工作台创建小说「我的测试小说」自动进入编辑器
  * 工具栏显示自动连载控制：开启/暂停/立即生成/设置
  * 点击「开启」后 mini-service 在 30 秒内扫描到任务
  * 自动调用 AI 生成第 2 章「异世界初体验」2565 字（耗时约 1 分钟）
  * 章节树立即显示新生成的章节，可点击查看完整内容
  * Token 余额从 999,999 减少到 999,038（消耗 961 Token）
  * 用户中心充值 ¥29.9 套餐，弹出模拟支付窗，确认后 Token 增加到 1,199,038
  * 充值记录表格显示订单详情
  * 管理员后台总览数据实时更新：2 用户/1 作品/2 章节/1 AI 调用/1 已支付订单/¥29.90 收入
  * 订单 Tab 显示完整订单列表
  * AI 日志 Tab 显示自动连载调用记录（preset=auto_serial，961 Token）
  * 退出登录回到登录页

Stage Summary:
- 三大功能模块全部完成且端到端验证通过
- 数据库：新增 Order 和 AutoSerial 表，User 加 password/role/banned 字段
- 鉴权：JWT + scrypt 自实现，无需引入 NextAuth，预置管理员账号
- 充值：完整订单流程（创建订单 → 模拟支付 → Token 到账 → 订单记录）
- AI 自动连载：独立 mini-service 定时扫描执行，支持配置间隔/字数/剧情走向
- 管理员后台：5 个 Tab 完整覆盖用户/作品/订单/AI日志/平台总览
- 所有 API 都有权限校验，401/402 错误前端正确处理
- 演示账号：管理员 admin@moli.com / admin123

---
Task ID: extend-2
Agent: 主 Agent (fullstack-dev)
Task: 实现邮件验证功能 - 管理员后台配置 SMTP，用户注册时邮箱验证码验证

Work Log:
- 扩展 Prisma schema：新增 EmailConfig（管理员 SMTP 配置，单条记录全局唯一）和 EmailCode（验证码）模型
- 安装 nodemailer@9.0.3 + @types/nodemailer
- 创建 src/lib/email.ts 工具库：
  * getEmailConfig / createTransporter - 获取配置并创建 SMTP transporter
  * sendTestEmail - 发送测试邮件（HTML 模板，渐变标题）
  * sendVerificationCode - 发送验证码邮件（6 位数字大字体展示）
  * generateCode - 生成 6 位随机验证码
  * createAndSaveCode - 创建并保存验证码（同时作废之前的同邮箱未使用码）
  * verifyCode - 校验验证码（检查 used/expired/expiresAt，校验后标记 used）
  * SMTP_PRESETS - 7 个常见邮箱预设（163/126/qq/gmail/outlook/aliyun/tencent）
- 创建 /api/admin/email-config GET/POST/PATCH 路由：
  * GET 返回配置（密码字段返回 ******）
  * POST 创建或更新（密码字段为 '******' 或空时保留原密码）
  * PATCH 单独切换 enabled 状态
- 创建 /api/admin/email-test POST 路由：发送测试邮件，记录 lastTestAt/lastTestOk/lastTestErr
- 创建 /api/auth/send-code POST 路由：
  * 邮箱格式校验
  * 注册场景检查邮箱是否已注册
  * 60 秒频率限制
  * 创建验证码 + 发送邮件
- 创建 /api/auth/verify-code POST 路由：独立校验验证码
- 改造 /api/auth/register：强制要求 code 参数，调用 verifyCode 校验通过后才创建用户
- 管理员后台新增「邮箱配置」Tab：
  * 状态卡片：显示当前 SMTP 配置 + 启用/禁用切换 + 上次测试结果
  * 配置表单：7 个预设快捷按钮 + SMTP 服务器/端口/加密方式/账号/密码/发件人名
  * 网易 163 邮箱注意事项提示
  * 测试邮件发送区
- 注册页面增加验证码字段：
  * 邮箱输入框下方新增「邮箱验证码 *」字段
  * 「发送验证码」按钮 + 60 秒倒计时
  * 验证码 10 分钟有效提示
  * handleRegister 强制要求验证码
- ESLint 通过
- Agent Browser 端到端验证：
  * 管理员登录后看到「邮箱配置」Tab（共 6 个 Tab）
  * 点击「163」预设，自动填入 smtp.163.com:465 SSL
  * 填入 moling_support@163.com + 密码，点击「保存配置」成功
  * 状态卡片显示「● 已启用」+ SMTP 信息 + 发件账号
  * 点击「发送测试」邮件，UI 显示具体错误：「Invalid login: 550 User has no permission」
  * 退出登录，注册页面显示「邮箱验证码」字段 + 「发送验证码」按钮
  * 输入假验证码注册，返回「验证码错误或已失效」
  * 禁用邮件服务后，用户发送验证码返回「邮件服务未配置或已禁用，请联系管理员」
  * 重新启用邮件服务，UI 显示「邮件服务已启用」

Stage Summary:
- 邮件验证功能完整实现，覆盖管理员 SMTP 配置 + 用户注册验证码完整流程
- 数据库：新增 EmailConfig 和 EmailCode 表
- 工具库：src/lib/email.ts 封装所有邮件相关操作
- API：4 个新路由 + 1 个改造路由
- 前端：管理员后台新增 Tab + 注册页面新增验证码步骤
- 已知限制：
  * 用户提供的 163 密码是邮箱登录密码，不是 SMTP 授权码
  * 163 邮箱要求使用「客户端授权密码」，需用户在 163 邮箱后台开启 SMTP 服务并生成授权码
  * UI 已明确提示此注意事项
