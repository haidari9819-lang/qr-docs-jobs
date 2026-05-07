'use client'
import { useState, useMemo } from 'react'
import { avatarColor, initials, formatDate, BRANCHEN, STELLENARTEN } from '@/lib/helpers'
import JobAlert from './components/JobAlert'

const MAIN = 'https://www.qr-docs.de'

interface Job {
  id: string
  titel: string
  stellenart: string
  branche: string
  standort: string
  beschreibung: string
  gehalt_min?: number
  gehalt_max?: number
  skills?: string[]
  is_featured: boolean
  created_at: string
  firma_id: string
  firmen_profile?: { firmenname: string; branche?: string; standort?: string; plan?: string }
}

interface Props {
  initialJobs: Job[]
  stats: { jobs: number; firmen: number; ausbildung: number }
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid #e5e5e5',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#18181b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>QR-Docs Jobs</span>
        </a>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Jobs finden',  href: '/' },
            { label: 'Ausbildung',   href: '/ausbildung' },
            { label: 'Praktikum',    href: '/praktikum' },
            { label: 'Minijobs',     href: '/minijob' },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>{l.label}</a>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href={`${MAIN}/dashboard`} style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>
          Zum Dashboard
        </a>
        <a href="/ausschreiben" style={{
          padding: '7px 14px', background: '#18181b', color: '#fff',
          borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
        }}>
          + Stelle kostenlos ausschreiben
        </a>
      </div>
    </nav>
  )
}

// ── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  const firma  = job.firmen_profile?.firmenname ?? 'Unbekannt'
  const color  = avatarColor(firma)
  const init   = initials(firma)
  const isPro  = ['business', 'enterprise', 'lifetime'].includes(job.firmen_profile?.plan ?? '')

  return (
    <a href={`/jobs/${job.id}`} style={{
      display: 'block', textDecoration: 'none',
      background: '#fff',
      border: `1px solid ${job.is_featured ? '#f59e0b' : '#e5e5e5'}`,
      borderRadius: 12,
      padding: '16px 18px',
      transition: 'box-shadow .12s',
      position: 'relative',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
    >
      {job.is_featured && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          background: '#faeeda', color: '#854F0B',
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
        }}>⭐ Featured</span>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: color + '1a', border: `1.5px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color,
        }}>
          {init}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.titel}
          </div>
          {/* Firma + verified */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>{firma}</span>
            {isPro && (
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>✓ QR-Docs verifiziert</span>
            )}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {[job.stellenart, job.branche, job.standort].filter(Boolean).map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f5f5f5', color: '#555', border: '1px solid #e5e5e5' }}>{t}</span>
            ))}
            {(job.skills ?? []).slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>{s}</span>
            ))}
          </div>
          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: '#999' }}>
              {job.gehalt_min && job.gehalt_max
                ? `${job.gehalt_min.toLocaleString('de')}–${job.gehalt_max.toLocaleString('de')} €/Jahr`
                : job.gehalt_min
                ? `ab ${job.gehalt_min.toLocaleString('de')} €/Jahr`
                : ''}
              {job.gehalt_min ? ' · ' : ''}
              {formatDate(job.created_at)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#18181b' }}>Bewerben →</span>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JobSearchClient({ initialJobs, stats }: Props) {
  const [q,        setQ]        = useState('')
  const [region,   setRegion]   = useState('')
  const [art,      setArt]      = useState('')
  const [branche,  setBranche]  = useState('')

  const filtered = useMemo(() => {
    const qL = q.toLowerCase()
    return initialJobs.filter(j => {
      if (q && !j.titel.toLowerCase().includes(qL) && !j.beschreibung?.toLowerCase().includes(qL)) return false
      if (region && !j.standort?.toLowerCase().includes(region.toLowerCase())) return false
      if (art    && j.stellenart !== art)   return false
      if (branche && j.branche !== branche) return false
      return true
    })
  }, [initialJobs, q, region, art, branche])

  return (
    <div>
      <Nav />

      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '40px 32px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
            Der Jobmarkt für KMU & Handwerk
          </h1>
          <p style={{ fontSize: 15, color: '#666', margin: '0 0 28px' }}>
            Echte Stellen. Verifizierte Unternehmen. Kostenlos inserieren — für immer.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8, background: '#f8f8f7', border: '1px solid #e5e5e5', borderRadius: 12, padding: 8 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Job oder Stichwort suchen…"
              style={{ flex: 2, padding: '8px 12px', border: 'none', background: 'transparent', fontSize: 14, color: '#111', outline: 'none' }}
            />
            <input
              value={region}
              onChange={e => setRegion(e.target.value)}
              placeholder="Region / PLZ"
              style={{ flex: 1, padding: '8px 12px', border: 'none', background: 'transparent', fontSize: 14, color: '#111', outline: 'none', borderLeft: '1px solid #e5e5e5' }}
            />
            <button style={{
              padding: '8px 20px', background: '#18181b', color: '#fff',
              borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Suchen
            </button>
          </div>

          {/* Live stats */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 20 }}>
            {[
              { label: 'Offene Stellen', value: stats.jobs },
              { label: 'Unternehmen',   value: stats.firmen },
              { label: 'Ausbildungsplätze', value: stats.ausbildung },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 16 }}>

        {/* LEFT: Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Stellenart</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => setArt('')} style={{ textAlign: 'left', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: art === '' ? '#111' : '#666', fontWeight: art === '' ? 600 : 400 }}>
                Alle
              </button>
              {STELLENARTEN.map(s => (
                <button key={s} onClick={() => setArt(art === s ? '' : s)} style={{ textAlign: 'left', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: art === s ? '#111' : '#666', fontWeight: art === s ? 600 : 400 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Branche</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => setBranche('')} style={{ textAlign: 'left', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: branche === '' ? '#111' : '#666', fontWeight: branche === '' ? 600 : 400 }}>
                Alle
              </button>
              {BRANCHEN.map(b => (
                <button key={b} onClick={() => setBranche(branche === b ? '' : b)} style={{ textAlign: 'left', padding: '5px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: branche === b ? '#111' : '#666', fontWeight: branche === b ? 600 : 400 }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE: Job list */}
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            <strong style={{ color: '#111' }}>{filtered.length}</strong> Stellen gefunden
          </div>
          {filtered.length === 0 ? (
            <div>
              <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '32px 24px', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>💼</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 6 }}>Keine Stellen gefunden</div>
                <div style={{ fontSize: 12, color: '#999' }}>Passe deine Suche an oder aktiviere einen Job-Alert</div>
              </div>
              <JobAlert region={region || undefined} branche={branche || undefined} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Branchen Links */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Jobs nach Branche</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { slug: 'handwerk',       label: 'Handwerk' },
                { slug: 'lager-logistik', label: 'Lager & Logistik' },
                { slug: 'gastronomie',    label: 'Gastronomie' },
                { slug: 'einzelhandel',   label: 'Einzelhandel' },
                { slug: 'produktion',     label: 'Produktion' },
                { slug: 'gesundheit',     label: 'Gesundheit' },
              ].map(b => (
                <a key={b.slug} href={`/jobs/${b.slug}`} style={{ fontSize: 12, color: '#555', textDecoration: 'none', padding: '3px 0', borderBottom: '1px solid #f5f5f5' }}>
                  {b.label} Jobs →
                </a>
              ))}
            </div>
          </div>

          {/* Dashboard banner */}
          <div style={{ background: '#18181b', borderRadius: 12, padding: '18px 16px', color: '#fff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>QR-Docs Dashboard</div>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 14, lineHeight: 1.5 }}>
              Stelle ausschreiben, Bewerbungen verwalten und dein Team finden.
            </div>
            <a href="/ausschreiben" style={{
              display: 'block', textAlign: 'center', padding: '8px 0',
              background: '#fff', color: '#18181b', borderRadius: 7,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}>
              + Kostenlos inserieren
            </a>
          </div>

          {/* VERA Matching */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 10 }}>◆ VERA-Matching</div>
            <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
              VERA analysiert offene Stellen und findet die besten Matches für dein Unternehmen.
            </div>
            <a href={`${MAIN}/dashboard`} style={{
              display: 'block', textAlign: 'center', padding: '7px 0',
              background: '#f5f5f4', color: '#111', borderRadius: 7,
              fontSize: 11, fontWeight: 600, textDecoration: 'none', border: '1px solid #e5e5e5',
            }}>
              Im Dashboard ansehen →
            </a>
          </div>

          {/* Top Firmen */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 12 }}>Top Firmen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...new Map(initialJobs.map(j => [j.firma_id, j.firmen_profile?.firmenname ?? ''])).entries()]
                .slice(0, 5).map(([id, name]) => {
                  const color = avatarColor(name)
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: color + '1a', border: `1px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color, flexShrink: 0,
                      }}>
                        {initials(name)}
                      </div>
                      <div style={{ fontSize: 12, color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </div>
                    </div>
                  )
                })}
              {initialJobs.length === 0 && (
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: '8px 0' }}>Noch keine Firmen</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e5e5', padding: '48px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', marginBottom: 8 }}>
            Häufige Fragen
          </h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>Alles, was du über QR-Docs Jobs wissen musst.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              {
                q: 'Wie finde ich einen Job im Handwerk?',
                a: 'Nutze die Branchenfilter links oder besuche direkt /jobs/handwerk. Alle Stellen stammen von verifizierten KMU — kein Spam, keine Fake-Inserate.',
              },
              {
                q: 'Wie schalte ich eine Stellenanzeige?',
                a: 'Melde dich mit deinem QR-Docs Konto an und klicke auf "+ Stelle ausschreiben". Titel, Branche, Stellenart, Gehalt — fertig. Deine Stelle erscheint sofort.',
              },
              {
                q: 'Was kostet eine Stelle bei QR-Docs Jobs?',
                a: 'Komplett kostenlos — für immer. Einfach anmelden und Stelle ausschreiben. Kein Abo, keine versteckten Kosten.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                style={{ borderTop: '1px solid #e5e5e5', padding: '16px 0' }}
              >
                <summary style={{ fontSize: 15, fontWeight: 700, color: '#111', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  {faq.q}
                  <span style={{ fontSize: 18, color: '#aaa', flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '12px 0 0', paddingRight: 32 }}>
                  {faq.a}
                </p>
              </details>
            ))}
            <div style={{ borderTop: '1px solid #e5e5e5' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
