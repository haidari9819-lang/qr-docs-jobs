// ── Slug ─────────────────────────────────────────────────────────────────────
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Color hash for firm avatars ─────────────────────────────────────────────
export function avatarColor(str: string): string {
  const palette = ['#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#22c55e', '#ec4899', '#f97316', '#14b8a6']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Shared style constants ───────────────────────────────────────────────────
export const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: 12,
  padding: '16px 18px',
}

export const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.07em',
  color: '#aaa',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: 5,
}

export const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  fontSize: 13,
  color: '#111',
  background: '#fafafa',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

export const BTN_PRIMARY: React.CSSProperties = {
  background: '#18181b',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

export const BRANCHEN = [
  'Handwerk', 'Einzelhandel', 'Gastronomie', 'Logistik', 'Produktion',
  'Gesundheit', 'Baugewerbe', 'IT & Tech', 'Dienstleistungen', 'Bildung',
  'Automotive', 'Energie', 'Immobilien', 'Reinigung', 'Sicherheit',
]

export const STELLENARTEN = ['Vollzeit', 'Teilzeit', 'Ausbildung', 'Praktikum', 'Minijob']

export const ALL_SKILLS = [
  'Lagerbestand', 'QR-Scans', 'Wartung', 'Reparatur', 'Rechnungen',
  'DATEV', 'HR', 'Dokumentation', 'Controlling', 'Warenwirtschaft',
  'Team', 'Kundenservice', 'Verkauf', 'Buchhaltung', 'IT',
]

