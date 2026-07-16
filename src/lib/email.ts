import nodemailer from 'nodemailer'
import { db } from './db'

// 获取当前邮件配置
export async function getEmailConfig() {
  return db.emailConfig.findFirst({ orderBy: { createdAt: 'desc' } })
}

// 创建 transporter（每次调用时根据最新配置创建）
export async function createTransporter() {
  const config = await getEmailConfig()
  if (!config) return null
  if (!config.enabled) return null

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  return { transporter, config }
}

// 发送测试邮件
export async function sendTestEmail(targetEmail: string) {
  const result = await createTransporter()
  if (!result) {
    return { ok: false, error: '邮件服务未配置或已禁用' }
  }
  const { transporter, config } = result
  try {
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.smtpUser}>`,
      to: targetEmail,
      subject: '【墨灵写作】邮件服务测试',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">墨灵写作</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 13px;">AI 驱动的网文创作平台</p>
          </div>
          <div style="background: #fafafa; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin: 0 0 12px; font-size: 18px;">邮件服务测试成功</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 12px;">
              这是一封来自墨灵写作平台的测试邮件。如果你收到了，说明 SMTP 邮件服务配置正确，可以正常向用户发送验证码邮件。
            </p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin: 16px 0;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">配置信息</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #1f2937; font-family: monospace;">
                ${config.smtpHost}:${config.smtpPort} / ${config.smtpUser}
              </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
              发送时间：${new Date().toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      `,
    })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// 生成 6 位验证码
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送验证码邮件
export async function sendVerificationCode(email: string, code: string, purpose: string = 'register') {
  const result = await createTransporter()
  if (!result) {
    return { ok: false, error: '邮件服务未配置或已禁用，请联系管理员' }
  }
  const { transporter, config } = result

  const purposeText = purpose === 'register' ? '注册账号' : purpose === 'reset' ? '重置密码' : '身份验证'

  try {
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.smtpUser}>`,
      to: email,
      subject: `【墨灵写作】${purposeText}验证码：${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">墨灵写作</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 13px;">AI 驱动的网文创作平台</p>
          </div>
          <div style="background: #fafafa; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin: 0 0 12px; font-size: 18px;">${purposeText}验证码</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
              你正在进行${purposeText}操作。请使用以下验证码完成验证：
            </p>
            <div style="background: white; border: 2px dashed #8b5cf6; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #ef4444; font-size: 13px; margin: 12px 0;">
              ⚠ 验证码 10 分钟内有效，请勿告知他人。
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
              如果这不是你本人的操作，请忽略此邮件。<br/>
              发送时间：${new Date().toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      `,
    })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// 创建并保存验证码（同时作废之前的同邮箱同用途未使用验证码）
export async function createAndSaveCode(email: string, purpose: string = 'register') {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 分钟有效

  // 作废之前未使用的同邮箱同用途验证码
  await db.emailCode.updateMany({
    where: { email, purpose, used: false },
    data: { expired: true },
  })

  await db.emailCode.create({
    data: { email, code, purpose, expiresAt },
  })

  return code
}

// 验证码校验
export async function verifyCode(email: string, code: string, purpose: string = 'register'): Promise<{ ok: boolean; error?: string }> {
  const record = await db.emailCode.findFirst({
    where: { email, code, purpose, used: false, expired: false },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return { ok: false, error: '验证码错误或已失效' }
  }

  if (new Date() > record.expiresAt) {
    await db.emailCode.update({ where: { id: record.id }, data: { expired: true } })
    return { ok: false, error: '验证码已过期，请重新获取' }
  }

  // 标记为已使用
  await db.emailCode.update({ where: { id: record.id }, data: { used: true } })
  return { ok: true }
}

// 常见 SMTP 配置预设
export const SMTP_PRESETS: Record<string, { host: string; port: number; secure: boolean; help: string }> = {
  '163': { host: 'smtp.163.com', port: 465, secure: true, help: '网易163邮箱，需使用授权码（非登录密码）' },
  '126': { host: 'smtp.126.com', port: 465, secure: true, help: '网易126邮箱，需使用授权码' },
  'qq': { host: 'smtp.qq.com', port: 465, secure: true, help: 'QQ邮箱，需使用授权码' },
  'gmail': { host: 'smtp.gmail.com', port: 465, secure: true, help: 'Gmail，需使用应用专用密码' },
  'outlook': { host: 'smtp.office365.com', port: 587, secure: false, help: 'Outlook / Hotmail' },
  'aliyun': { host: 'smtp.qiye.aliyun.com', port: 465, secure: true, help: '阿里云企业邮箱' },
  'tencent': { host: 'smtp.exmail.qq.com', port: 465, secure: true, help: '腾讯企业邮箱' },
}
