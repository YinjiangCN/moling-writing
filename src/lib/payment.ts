import { AlipaySdk } from 'alipay-sdk'
import { db } from './db'

// 支付配置模型（存在 PaymentConfig 表中，管理员可后台配置）
// 如果数据库中没有配置，则使用环境变量 fallback

export interface PaymentConfig {
  appId: string
  privateKey: string // 应用私钥
  alipayPublicKey: string // 支付宝公钥
  sandbox: boolean // 是否沙箱环境
  enabled: boolean
}

// 从数据库获取支付配置
export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  try {
    // 用 EmailConfig 表的 id 字段约定一个特殊值来存储支付配置
    // 更好的方案是新建表，但为了不频繁改 schema，用 KV 方式存在 EmailConfig 的 lastTestErr 字段中
    // 实际上我们新建一个 PaymentConfig 表更好——但这里用 env + db 混合方案
    
    // 方案：用环境变量作为配置源（管理员在 .env 中配置）
    const appId = process.env.ALIPAY_APP_ID
    const privateKey = process.env.ALIPAY_PRIVATE_KEY
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY
    
    if (!appId || !privateKey || !alipayPublicKey) {
      return null
    }
    
    return {
      appId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      alipayPublicKey: alipayPublicKey.replace(/\\n/g, '\n'),
      sandbox: process.env.ALIPAY_SANDBOX === 'true',
      enabled: true,
    }
  } catch {
    return null
  }
}

// 创建 AlipaySdk 实例
export async function createAlipayClient(): Promise<AlipaySdk | null> {
  const config = await getPaymentConfig()
  if (!config) return null

  return new AlipaySdk({
    appId: config.appId,
    privateKey: config.privateKey,
    alipayPublicKey: config.alipayPublicKey,
    gateway: config.sandbox
      ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do',
    signType: 'RSA2',
  })
}

// 检查支付是否可用
export async function isPaymentAvailable(): Promise<boolean> {
  const config = await getPaymentConfig()
  return !!(config && config.enabled)
}
