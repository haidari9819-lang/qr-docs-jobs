'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/helpers'

interface Job {
  id: string
  titel: string
  stellenart: string
  standort: string
  branche: string
  aktiv: boolean
  featured: boolean
  created_at: string
}

interface Bewerbung {
  id: string
  job_id: string
  name: string
  email: string
  telefon?: string
  anschreiben?: string
  status: string
  created_at: string
}

interface Props {
  profil: { id: string; firmenname: string; plan?: string }
  jobs: Job[]
  bewerbungen: Bewerbung[]
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  neu:       { bg: '#f0f9ff', color: '#0369a1' },
  gesehen:   { bg: '#f5f5f5', color: '#555' },
  eingeladen:{ bg: '#f0fdf4', color: '#16a34a' },
  abgelehnt: { bg: '#fef2f2', color: '#dc2626' },
}

export default function JobsDashboardClient({ profil, jobs, bewerbungen }: Props) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const jobBewerbungen = (jobId: string) => bewerbungen.filter(b => b.job_id === jobId)
  const activeJobs     = jobs.filter(j => j.aktiv)
  const todayStr       = new Date().toDateString()
  const newToday       = bewerbungen.filter(b => new Date(b.created_at).toDateString() === todayStr).length

  async function toggleJob(job: Job) {
    await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktiv: !job.aktiv }),
    })
    window.location.reload()
  }

  async function deleteJob(id: string) {
    if (!confirm('Job wirklich löschen?')) return
    setDeleting(id)
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '16px 18px' }
  const LABEL: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: '#aaa', textTransform: 'uppercase', display: 'block', marginBottom: 3 }

  return (
    <div>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#18181b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>QR-Docs Jobs</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="https://www.qr-docs.de/dashboard" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← QR-Docs Dashboard</a>
          <a href="/ausschreiben" style={{ padding: '7px 14px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            + Neue Stelle
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 3px', color: '#111', letterSpacing: '-0.03em' }}>Jobs Dashboard</h1>
          <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{profil.firmenname}</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Aktive Stellen',       value: activeJobs.length },
            { label: 'Gesamt-Bewerbungen',   value: bewerbungen.length },
            { label: 'Neue heute',           value: newToday },
            { label: 'Ø Zeit bis Besetzung', value: '—' },
          ].map(kpi => (
            <div key={kpi.label} style={{ ...CARD }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#111', lineHeight: 1, marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <div style={{ ...CARD, textAlign: 'center', padding: '56px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>💼</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>Noch keine Stellen</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 22 }}>Schreibe deine erste Stelle aus und finde Mitarbeiter</div>
            <a href="/ausschreiben" style={{ padding: '9px 20px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              + Erste Stelle ausschreiben
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map(job => {
              const bews = jobBewerbungen(job.id)
              const isExpanded = activeJobId === job.id
              return (
                <div key={job.id} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Job row */}
                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2 }}>{job.titel}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{job.stellenart} · {job.standort} · {formatDate(job.created_at)}</div>
                    </div>

                    {/* Bewerbungen count */}
                    <button onClick={() => setActiveJobId(isExpanded ? null : job.id)} style={{
                      padding: '5px 12px', background: '#f5f5f5', border: '1px solid #e5e5e5',
                      borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#333',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      📋 {bews.length} Bewerbung{bews.length !== 1 ? 'en' : ''}
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: 'transform .15s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>

                    {/* Status */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                      background: job.aktiv ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)',
                      color: job.aktiv ? '#16a34a' : '#64748b',
                    }}>
                      {job.aktiv ? '● AKTIV' : '○ PAUSIERT'}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleJob(job)} style={{ padding: '5px 10px', background: 'none', border: '1px solid #e5e5e5', borderRadius: 7, cursor: 'pointer', fontSize: 11, color: '#555' }}>
                        {job.aktiv ? 'Pausieren' : 'Aktivieren'}
                      </button>
                      <a href={`/ausschreiben?edit=${job.id}`} style={{ padding: '5px 10px', background: 'none', border: '1px solid #e5e5e5', borderRadius: 7, cursor: 'pointer', fontSize: 11, color: '#555', textDecoration: 'none' }}>
                        Bearbeiten
                      </a>
                      <button onClick={() => deleteJob(job.id)} disabled={deleting === job.id} style={{ padding: '5px 10px', background: 'none', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontSize: 11, color: '#dc2626' }}>
                        {deleting === job.id ? '…' : 'Löschen'}
                      </button>
                    </div>
                  </div>

                  {/* Bewerbungen expand */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f5f5f5', background: '#fafafa' }}>
                      {bews.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#aaa' }}>Noch keine Bewerbungen</div>
                      ) : bews.map(b => (
                        <div key={b.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{b.name}</div>
                            <div style={{ fontSize: 11, color: '#999' }}>{b.email}{b.telefon ? ` · ${b.telefon}` : ''}</div>
                            {b.anschreiben && (
                              <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.5 }}>
                                {b.anschreiben.slice(0, 120)}{b.anschreiben.length > 120 ? '…' : ''}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#999' }}>{formatDate(b.created_at)}</div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                            background: (STATUS_COLORS[b.status] ?? STATUS_COLORS.neu).bg,
                            color: (STATUS_COLORS[b.status] ?? STATUS_COLORS.neu).color,
                          }}>
                            {b.status?.toUpperCase() ?? 'NEU'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

