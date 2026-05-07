import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR-Docs Jobs — Jobmarkt für KMU & Handwerk',
  description: 'Finde passende Stellen oder schreibe deine nächste Stelle aus. Der Jobmarkt für KMU und Handwerk.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f4', color: '#111' }}>
        {children}
      </body>
    </html>
  )
}

