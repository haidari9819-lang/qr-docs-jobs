import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const url    = req.nextUrl.searchParams.get('url')
  const size   = Number(req.nextUrl.searchParams.get('size') ?? '300')

  if (!url) return NextResponse.json({ error: 'url param required' }, { status: 400 })

  const png = await QRCode.toBuffer(url, {
    type:   'png',
    width:  Math.min(size, 600),
    margin: 2,
    color:  { dark: '#18181b', light: '#ffffff' },
  })

  return new Response(png.buffer as ArrayBuffer, {
    headers: {
      'Content-Type':        'image/png',
      'Cache-Control':       'public, max-age=86400, immutable',
      'Content-Disposition': `inline; filename="qr-bewerbung.png"`,
    },
  })
}
