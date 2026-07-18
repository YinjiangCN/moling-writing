import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAlipayClient } from '@/lib/payment'

// POST /api/payment/alipay/notify - 支付宝异步回调通知
export async function POST(req: NextRequest) {
  try {
    // 获取支付宝 POST 的表单数据
    const formData = await req.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = String(value)
    })

    const {
      trade_status,
      out_trade_no,
      trade_no,
      total_amount,
      sign,
      sign_type,
      ...restParams
    } = params

    // 验签
    const alipayClient = await createAlipayClient()
    if (!alipayClient) {
      console.error('[Alipay Notify] 支付配置不可用')
      return new NextResponse('fail', { status: 500 })
    }

    // alipay-sdk v4 的验签方式
    const verifyParams = { ...params }
    delete verifyParams.sign
    delete verifyParams.sign_type

    const signVerified = alipayClient.checkNotifySign(params)
    
    if (!signVerified) {
      console.error('[Alipay Notify] 验签失败', { out_trade_no, trade_no })
      return new NextResponse('fail', { status: 400 })
    }

    // 只处理交易成功的通知
    if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
      return new NextResponse('success')
    }

    // 查找订单
    const order = await db.order.findUnique({ where: { id: out_trade_no } })
    if (!order) {
      console.error('[Alipay Notify] 订单不存在', out_trade_no)
      return new NextResponse('fail', { status: 404 })
    }

    // 已支付则忽略（防重复通知）
    if (order.status === 'paid') {
      return new NextResponse('success')
    }

    // 验证金额
    if (Math.abs(order.amount - parseFloat(total_amount)) > 0.01) {
      console.error('[Alipay Notify] 金额不匹配', { orderId: out_trade_no, expected: order.amount, got: total_amount })
      return new NextResponse('fail', { status: 400 })
    }

    // 事务：更新订单 + 增加 Token
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: order.userId },
        data: { tokens: { increment: order.tokens } },
      }),
    ])

    console.log(`[Alipay Notify] 支付成功: 订单 ${out_trade_no}, 支付宝交易号 ${trade_no}, 金额 ¥${total_amount}, Token +${order.tokens}`)

    return new NextResponse('success')
  } catch (e: any) {
    console.error('[Alipay Notify] 异常:', e.message)
    return new NextResponse('fail', { status: 500 })
  }
}
