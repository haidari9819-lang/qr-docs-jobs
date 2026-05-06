'use client'
import { avatarColor, initials, formatDate } from '@/lib/helpers'
import { STAEDTE_SLUGS, STAEDTE, BrancheInfo, BRANCHEN_SLUGS } from '@/lib/seo-data'

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
  firma_id?: string
  firmen_profile?: { firmenname: string; branche?: string; standort?: string; plan?: string }
}

interface Props {
  brancheSlug:  string
  brancheInfo:  BrancheInfo
  jobs:         Job[]
  stadtSlug?:   string
  stadtLabel?:  string
}

function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid #e5e5e5',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56,
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <div style={{ width: 28, height: 28, background: '#18181b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/>
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>QR-Docs Jobs</span>
      </a>
      <div style={{ display: 'flex', gap: 10 }}>
        <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Alle Jobs</a>
        <a href="/ausschreiben" style={{ padding: '7px 14px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          + Stelle ausschreiben
        </a>
      </div>
    </nav>
  )
}

function JobCard({ job }: { job: Job }) {
  const firma = job.firmen_profile?.firmenname ?? 'Unbekannt'
  const color = avatarColor(firma)
  const init  = initials(firma)
  const isPro = ['business', 'enterprise', 'lifetime'].includes(job.firmen_profile?.plan ?? '')

  return (
    <a href={`/jobs/${job.id}`} style={{
      display: 'block', textDecoration: 'none',
      background: '#fff',
      border: `1px solid ${job.is_featured ? '#f59e0b' : '#e5e5e5'}`,
      borderRadius: 12, padding: '16px 18px', position: 'relative',
    }}>
      {job.is_featured && (
        <span style={{ position: 'absolute', top: 12, right: 12, background: '#faeeda', color: '#854F0B', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>⭐ Featured</span>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: color + '1a', border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color }}>
          {init}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.titel}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>{firma}</span>
            {isPro && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>✓ Verifiziert</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {[job.stellenart, job.branche, job.standort].filter(Boolean).map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f5f5f5', color: '#555', border: '1px solid #e5e5e5' }}>{t}</span>
            ))}
            {(job.skills ?? []).slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>{s}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: '#999' }}>
              {job.gehalt_min ? `ab ${job.gehalt_min.toLocaleString('de')} €/Jahr · ` : ''}{formatDate(job.created_at)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#18181b' }}>Bewerben →</span>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function BranchePageClient({ brancheSlug, brancheInfo, jobs, stadtSlug, stadtLabel }: Props) {
  const h1 = stadtLabel
    ? `${brancheInfo.label} Jobs ${stadtLabel} — Jetzt bewerben`
    : `${brancheInfo.label} Jobs — Verifizierte Stellen bei KMU`

  return (
    <div style={{ background: '#f5f5f4', minHeight: '100vh' }}>
      <Nav />

      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '32px 32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Jobs</a>
            <span>›</span>
            <a href={`/jobs/${brancheSlug}`} style={{ color: stadtSlug ? '#aaa' : '#111', textDecoration: 'none', fontWeight: stadtSlug ? 400 : 600 }}>
              {brancheInfo.label}
            </a>
            {stadtLabel && (
              <>
                <span>›</span>
                <span style={{ color: '#111', fontWeight: 600 }}>{stadtLabel}</span>
              </>
            )}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            {h1}
          </h1>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 20px' }}>{brancheInfo.description}</p>

          {/* City filter pills */}
          {!stadtSlug && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center' }}>Eingrenzen:</span>
              {STAEDTE_SLUGS.map(s => (
                <a
                  key={s}
                  href={`/jobs/${brancheSlug}/${s}`}
                  style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: '#f5f5f4', color: '#555', border: '1px solid #e5e5e5', textDecoration: 'none' }}
                >
                  {STAEDTE[s]}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>

        {/* Job list */}
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            <strong style={{ color: '#111' }}>{jobs.length}</strong>{' '}
            {brancheInfo.label} Stelle{jobs.length !== 1 ? 'n' : ''}{stadtLabel ? ` in ${stadtLabel}` : ''} gefunden
          </div>

          {jobs.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>💼</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                Noch keine {brancheInfo.label} Stellen{stadtLabel ? ` in ${stadtLabel}` : ''}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Werde der Erste und schalte eine Stellenanzeige</div>
              <a href="/ausschreiben" style={{ padding: '9px 20px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Stelle ausschreiben →
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Andere Branchen */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Andere Branchen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {BRANCHEN_SLUGS.filter(s => s !== brancheSlug).map(s => {
                const labels: Record<string, string> = { handwerk: 'Handwerk', 'lager-logistik': 'Lager & Logistik', gastronomie: 'Gastronomie', einzelhandel: 'Einzelhandel', produktion: 'Produktion', gesundheit: 'Gesundheit' }
                return (
                  <a key={s} href={`/jobs/${s}`} style={{ fontSize: 12, color: '#555', textDecoration: 'none', padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                    {labels[s]} Jobs →
                  </a>
                )
              })}
            </div>
          </div>

          {/* Stelle ausschreiben CTA */}
          <div style={{ background: '#18181b', borderRadius: 12, padding: '18px 16px', color: '#fff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Stelle ausschreiben</div>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 14, lineHeight: 1.5 }}>
              Schalte deine {brancheInfo.label} Stelle bei QR-Docs Jobs und finde qualifizierte Bewerber.
            </div>
            <a href="/ausschreiben" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#fff', color: '#18181b', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              Kostenlos starten →
            </a>
          </div>

          {/* Städte */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              {brancheInfo.label} Jobs nach Stadt
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STAEDTE_SLUGS.map(s => (
                <a
                  key={s}
                  href={`/jobs/${brancheSlug}/${s}`}
                  style={{
                    fontSize: 12,
                    color: stadtSlug === s ? '#18181b' : '#555',
                    fontWeight: stadtSlug === s ? 700 : 400,
                    textDecoration: 'none',
                    padding: '4px 0',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                >
                  {brancheInfo.label} Jobs {STAEDTE[s]} →
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
