import { NextRequest, NextResponse } from 'next/server'

// GET /api/payment/alipay/return - 支付宝同步返回（用户支付完成后跳回）
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const params = url.searchParams
  const outTradeNo = params.get('out_trade_no') || ''
  const tradeNo = params.get('trade_no') || ''

  // 同步返回只做展示，实际到账由异步 notify 处理
  // 重定向到前端支付结果页（带参数）
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  
  // 返回一个简单的 HTML 页面，自动关闭或跳转
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>支付结果 - 墨灵写作</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 400px; }
    .icon { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #34d399); display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 32px; height: 32px; color: white; }
    h1 { font-size: 20px; color: #1f2937; margin: 0 0 8px; }
    p { font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    .btn { display: inline-block; padding: 10px 32px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .order { font-size: 12px; color: #9ca3af; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </div>
    <h1>支付成功</h1>
    <p>Token 将自动到账，请稍后刷新用户中心查看余额<br/>如未到账，请等待几秒后刷新</p>
    <a href="${baseUrl || '/'}/" class="btn">返回墨灵写作</a>
    <div class="order">订单号: ${outTradeNo.slice(-12)}${tradeNo ? '<br/>交易号: ' + tradeNo.slice(-12) : ''}</div>
  </div>
  <script>
    // 3 秒后自动跳转
    setTimeout(function() {
      window.location.href = '${baseUrl || '/'}/';
    }, 5000);
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
