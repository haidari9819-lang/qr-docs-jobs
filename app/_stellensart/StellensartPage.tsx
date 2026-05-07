import { getAdminClient } from '@/lib/supabase/server'
import { avatarColor, initials, formatDate } from '@/lib/helpers'
import { STELLENART_SEO } from '@/lib/seo-data'

interface Job {
  id: string
  titel: string
  stellenart: string
  branche: string
  standort: string
  gehalt_min?: number
  created_at: string
  firmen_profile?: { firmenname: string; standort?: string; plan?: string }
}

function JobRow({ job }: { job: Job }) {
  const firma = job.firmen_profile?.firmenname ?? 'Unbekannt'
  const color = avatarColor(firma)
  const init  = initials(firma)
  const isPro = ['business', 'enterprise', 'lifetime'].includes(job.firmen_profile?.plan ?? '')

  return (
    <a href={`/jobs/${job.id}`} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12,
      padding: '14px 18px', textDecoration: 'none',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: color + '1a', border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color }}>
        {init}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.titel}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#666' }}>{firma}</span>
          {isPro && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>✓ Verifiziert</span>}
          <span style={{ fontSize: 10, color: '#aaa' }}>· {job.branche} · {job.standort}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {job.gehalt_min && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>ab {job.gehalt_min.toLocaleString('de')} €</div>}
        <div style={{ fontSize: 11, color: '#aaa' }}>{formatDate(job.created_at)}</div>
      </div>
    </a>
  )
}

export default async function StellensartPage({ artSlug }: { artSlug: string }) {
  const info = STELLENART_SEO[artSlug]
  if (!info) return null

  const supabase = getAdminClient()
  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*, firmen_profile(firmenname, standort, plan)')
    .eq('aktiv', true)
    .eq('stellenart', info.dbValue)
    .order('featured', { ascending: false })
    .order('created_at',  { ascending: false })

  return (
    <div style={{ background: '#f5f5f4', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#18181b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>QR-Docs Jobs</span>
        </a>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Alle Jobs</a>
          <a href="/ausschreiben" style={{ padding: '7px 14px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            + Stelle ausschreiben
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '32px 32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
            <a href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Jobs</a>
            {' › '}
            <span style={{ color: '#111', fontWeight: 600 }}>{info.dbValue}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            {info.h1}
          </h1>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{info.description}</p>
        </div>
      </div>

      {/* Job list */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
          <strong style={{ color: '#111' }}>{(jobs ?? []).length}</strong> {info.dbValue}stelle{(jobs ?? []).length !== 1 ? 'n' : ''} gefunden
        </div>

        {(jobs ?? []).length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 6 }}>Noch keine {info.dbValue}stellen</div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Werde der Erste und schalte eine Stellenanzeige.</div>
            <a href="/ausschreiben" style={{ padding: '9px 20px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              Stelle ausschreiben →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(jobs ?? []).map((job: Job) => <JobRow key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  )
}

