import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionOr401 } from '@/lib/auth'
import { createAlipayClient, isPaymentAvailable } from '@/lib/payment'
import { getPackages } from '@/app/api/orders/route'

// POST /api/payment/alipay/create - 创建支付宝订单
export async function POST(req: NextRequest) {
  const session = await requireSessionOr401()
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: 401 })
  const user = session.user

  // 检查支付配置是否可用
  const available = await isPaymentAvailable()
  if (!available) {
    return NextResponse.json({
      error: '支付功能未配置，请联系管理员设置支付宝密钥',
    }, { status: 503 })
  }

  const body = await req.json()
  const { packageId } = body

  const packages = await getPackages()
  const pkg = packages.find((p) => p.id === packageId)
  if (!pkg) return NextResponse.json({ error: '套餐不存在' }, { status: 400 })

  // 创建订单
  const order = await db.order.create({
    data: {
      userId: user.id,
      amount: pkg.price,
      tokens: pkg.tokens,
      method: 'alipay',
      status: 'pending',
    },
  })

  // 调用支付宝下单
  const alipayClient = await createAlipayClient()
  if (!alipayClient) {
    return NextResponse.json({ error: '支付服务不可用' }, { status: 503 })
  }

  try {
    // 构造支付页面 URL（电脑网站支付 alipay.trade.page.pay）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const result = alipayClient.pageExecute('alipay.trade.page.pay', {
      method: 'GET',
      bizContent: {
        out_trade_no: order.id,
        total_amount: pkg.price.toFixed(2),
        subject: `墨灵写作 - ${pkg.tokens.toLocaleString()} Token`,
        body: `购买 ${pkg.name} 套餐`,
        product_code: 'FAST_INSTANT_TRADE_PAY',
      },
      notify_url: `${baseUrl}/api/payment/alipay/notify`,
      return_url: `${baseUrl}/api/payment/alipay/return`,
    })

    // pageExecute GET 模式返回的是完整 URL
    const payUrl = result as unknown as string

    return NextResponse.json({
      orderId: order.id,
      payUrl,
      message: '订单已创建，正在跳转支付页面',
    })
  } catch (e: any) {
    console.error('Alipay create order error:', e)
    return NextResponse.json({
      error: `支付宝下单失败：${e.message}`,
    }, { status: 500 })
  }
}
