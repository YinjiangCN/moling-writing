import { NextResponse } from 'next/server'
import { isPaymentAvailable } from '@/lib/payment'

// GET /api/payment/status - 检查支付是否可用
export async function GET() {
  const available = await isPaymentAvailable()
  return NextResponse.json({ available })
}
