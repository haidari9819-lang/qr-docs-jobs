'use client'
import { usePathname } from 'next/navigation'

const ORANGE = '#e8521a'
const GRAY   = '#9ca3af'

const ITEMS = [
  {
    label: 'Jobs',
    href:  '/',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ORANGE : GRAY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    label: 'Suche',
    href:  '/?fokus=suche',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ORANGE : GRAY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    label: 'Merkliste',
    href:  '/merkliste',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? ORANGE : 'none'} stroke={active ? ORANGE : GRAY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    label: 'Profil',
    href:  '/login',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ORANGE : GRAY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        height: 56, background: '#fff',
        borderTop: '0.5px solid #e5e5e5',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {ITEMS.map(item => {
          const active = pathname === item.href || (item.href === '/' && pathname === '/')
          return (
            <a
              key={item.label}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2, textDecoration: 'none',
                minWidth: 44, minHeight: 44,
                paddingTop: 6,
              }}
            >
              {item.icon(active)}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? ORANGE : GRAY, lineHeight: 1 }}>
                {item.label}
              </span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
