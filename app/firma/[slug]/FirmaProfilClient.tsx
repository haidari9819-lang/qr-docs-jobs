'use client'
import { useState, useRef } from 'react'
import { avatarColor, initials, formatDate } from '@/lib/helpers'

const ORANGE = '#e8521a'
const BASE   = 'https://jobs.qr-docs.de'

interface Firma {
  id: string
  firmenname: string
  branche?: string
  ort?: string
  plan?: string
  verified?: boolean
  slug: string
}

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
  featured: boolean
  created_at: string
  firma_id: string
}

// ── Nav ───────────────────────────────────────────────────────────────────────

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
            <rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/>
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>QR-Docs Jobs</span>
      </a>
      <a href="/ausschreiben" style={{
        padding: '7px 14px', background: '#18181b', color: '#fff',
        borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
      }}>
        + Stelle ausschreiben
      </a>
    </nav>
  )
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job, firmaName }: { job: Job; firmaName: string }) {
  return (
    <a href={`/jobs/${job.id}`} style={{
      display: 'block', textDecoration: 'none',
      background: '#fff',
      border: `1px solid ${job.featured ? '#f59e0b' : '#e5e5e5'}`,
      borderRadius: 12, padding: '16px 18px',
      transition: 'box-shadow .12s', position: 'relative',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
    >
      {job.featured && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          background: '#faeeda', color: '#854F0B',
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
        }}>⭐ Featured</span>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>
        {job.titel}
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>{firmaName}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {[job.stellenart, job.branche, job.standort].filter(Boolean).map(t => (
          <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f5f5f5', color: '#555', border: '1px solid #e5e5e5' }}>{t}</span>
        ))}
        {(job.skills ?? []).slice(0, 3).map(s => (
          <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>{s}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#999' }}>
          {job.gehalt_min && job.gehalt_max
            ? `${job.gehalt_min.toLocaleString('de')}–${job.gehalt_max.toLocaleString('de')} €/Jahr`
            : job.gehalt_min ? `ab ${job.gehalt_min.toLocaleString('de')} €/Jahr` : ''}
          {job.gehalt_min ? ' · ' : ''}{formatDate(job.created_at)}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#18181b' }}>Bewerben →</span>
      </div>
    </a>
  )
}

// ── Express-Bewerben Modal ────────────────────────────────────────────────────

function BewerbenModal({ firma, onClose }: { firma: Firma; onClose: () => void }) {
  const [name,       setName]       = useState('')
  const [telefon,    setTelefon]    = useState('')
  const [dateiName,  setDateiName]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !telefon) return
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('firma_id', firma.id)
      form.append('name',     name)
      form.append('telefon',  telefon)
      if (fileRef.current?.files?.[0]) form.append('datei', fileRef.current.files[0])

      const res  = await fetch('/api/firma-bewerbung', { method: 'POST', body: form })
      const data = await res.json()
      if (data.success) setSuccess(true)
      else setError(data.error ?? 'Fehler beim Senden')
    } catch {
      setError('Verbindungsfehler')
    }
    setSubmitting(false)
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #e5e5e5', borderRadius: 8,
    fontSize: 14, color: '#111', background: '#fafafa',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 540, padding: '28px 24px 40px',
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 }}>Bewerbung gesendet!</div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>{firma.firmenname} meldet sich bei dir.</div>
            <button onClick={onClose} style={{ padding: '10px 24px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Schließen
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>In 30 Sek. bewerben</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Initiativbewerbung bei {firma.firmenname}</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Name *</label>
                <input style={INPUT} placeholder="Dein vollständiger Name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Telefon *</label>
                <input style={INPUT} type="tel" placeholder="+49 170 1234567" value={telefon} onChange={e => setTelefon(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Foto / Gesellenbrief (optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed #e5e5e5', borderRadius: 8, padding: '14px',
                    textAlign: 'center', cursor: 'pointer', fontSize: 13, color: '#999',
                    background: dateiName ? '#f0fdf4' : '#fafafa',
                    borderColor: dateiName ? '#22c55e' : '#e5e5e5',
                  }}
                >
                  {dateiName ? <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ {dateiName}</span> : '📎 Datei auswählen (JPG, PDF, max. 5 MB)'}
                </div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                  onChange={e => setDateiName(e.target.files?.[0]?.name ?? '')} />
              </div>
              {error && <div style={{ fontSize: 13, color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}
              <button type="submit" disabled={submitting || !name || !telefon} style={{
                marginTop: 4, padding: '13px', background: (!name || !telefon) ? '#ccc' : ORANGE,
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: (!name || !telefon) ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
              }}>
                {submitting ? 'Wird gesendet…' : 'Jetzt bewerben →'}
              </button>
              <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
                Kein Account nötig · Deine Daten werden sicher übertragen
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── QR Section ────────────────────────────────────────────────────────────────

function QrSection({ firma }: { firma: Firma }) {
  const url    = `${BASE}/firma/${firma.slug}`
  const qrSrc  = `/api/qr?url=${encodeURIComponent(url)}&size=220`

  function print() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>QR-Code – ${firma.firmenname}</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;gap:12px}
      img{width:220px;height:220px}p{font-size:13px;color:#555;margin:0}</style></head>
      <body><img src="${qrSrc}" /><p>${firma.firmenname}</p><p style="font-size:11px;color:#aaa">${url}</p>
      <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>
    `)
    w.document.close()
  }

  return (
    <div style={{
      background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 14,
      padding: '24px', textAlign: 'center', maxWidth: 280,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 12 }}>QR-Code dieser Seite</div>
      <img src={qrSrc} alt="QR-Code" style={{ width: 160, height: 160, borderRadius: 8, display: 'block', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 11, color: '#999', marginBottom: 14, wordBreak: 'break-all' }}>{url}</div>
      <button onClick={print} style={{
        width: '100%', padding: '9px', background: '#18181b', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>
        🖨️ Für Fahrzeug-Sticker drucken
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FirmaProfilClient({ firma, jobs }: { firma: Firma; jobs: Job[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const color  = ORANGE
  const init   = initials(firma.firmenname)
  const isPro  = ['business', 'enterprise', 'lifetime'].includes(firma.plan ?? '')

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: 100 }}>
      <Nav />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '40px 32px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
            <a href="/" style={{ color: '#999', textDecoration: 'none' }}>Jobs</a>
            <span style={{ margin: '0 6px' }}>›</span>
            <span>Firmen-Profil</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Big Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 18, flexShrink: 0,
              background: ORANGE + '1a', border: `2.5px solid ${ORANGE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: ORANGE,
            }}>
              {init}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: '-0.03em', margin: 0 }}>
                  {firma.firmenname}
                </h1>
                {(isPro || firma.verified) && (
                  <span style={{
                    background: ORANGE + '15', color: ORANGE,
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                    border: `1px solid ${ORANGE}40`,
                  }}>
                    ✓ Verifiziert durch QR-Docs
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                {firma.branche && (
                  <span style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
                    🏷️ {firma.branche}
                  </span>
                )}
                {firma.ort && (
                  <span style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
                    📍 {firma.ort}
                  </span>
                )}
                <span style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
                  💼 {jobs.length} offene {jobs.length === 1 ? 'Stelle' : 'Stellen'}
                </span>
              </div>

              <button onClick={() => setModalOpen(true)} style={{
                padding: '10px 22px', background: ORANGE, color: '#fff',
                border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '-0.01em',
              }}>
                Jetzt in 30 Sek. bewerben →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px 0' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Job List */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>
              Offene Stellen ({jobs.length})
            </div>

            {jobs.length === 0 ? (
              <div style={{
                background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12,
                padding: '40px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                <div style={{ fontSize: 14, color: '#666' }}>Gerade keine offenen Stellen</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Trotzdem initiativ bewerben!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {jobs.map(j => <JobCard key={j.id} job={j} firmaName={firma.firmenname} />)}
              </div>
            )}
          </div>

          {/* Sidebar: QR Code */}
          <div style={{ flexShrink: 0 }}>
            <QrSection firma={firma} />
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff', borderTop: '1px solid #e5e5e5',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{firma.firmenname}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{jobs.length} offene {jobs.length === 1 ? 'Stelle' : 'Stellen'}</div>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          padding: '12px 24px', background: ORANGE, color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          Jetzt in 30 Sek. bewerben →
        </button>
      </div>

      {modalOpen && <BewerbenModal firma={firma} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
