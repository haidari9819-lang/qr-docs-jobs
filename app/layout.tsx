import type { Metadata } from 'next'
import './globals.css'
import BottomNav from './components/BottomNav'

export const metadata: Metadata = {
  title: 'QR-Docs Jobs — Jobmarkt für KMU & Handwerk',
  description: 'Finde passende Stellen oder schreibe deine nächste Stelle aus. Der Jobmarkt für KMU und Handwerk.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QR-Docs Jobs',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#e8521a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f4', color: '#111' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
