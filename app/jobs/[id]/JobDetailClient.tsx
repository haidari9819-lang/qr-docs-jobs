'use client'
import { useState, useEffect } from 'react'
import { avatarColor, initials, formatDate, CARD } from '@/lib/helpers'

const MAIN = 'https://www.qr-docs.de'
const ORANGE = '#E05C1A'

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
  firmen_profile?: {
    firmenname: string
    branche?: string
    standort?: string
    strasse?: string
    plz?: string
    email?: string
    plan?: string
    verified?: boolean
  }
}

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
  color: '#aaa', textTransform: 'uppercase', display: 'block', marginBottom: 5,
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1px solid #e5e5e5',
  borderRadius: 8, fontSize: 14, color: '#111', background: '#fafafa',
  outline: 'none', boxSizing: 'border-box',
}

function BewerbungForm({
  job, onSuccess, compact = false,
}: {
  job: Job
  onSuccess: () => void
  compact?: boolean
}) {
  const firma = job.firmen_profile?.firmenname ?? 'das Unternehmen'
  const [name,        setName]        = useState('')
  const [telefon,     setTelefon]     = useState('')
  const [email,       setEmail]       = useState('')
  const [anschreiben, setAnschreiben] = useState('')
  const [file,        setFile]        = useState<File | null>(null)
  const [showExtra,   setShowExtra]   = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !telefon) return
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Datei zu groß (max. 5 MB)')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('job_id', job.id)
      form.append('name', name)
      form.append('telefon', telefon)
      if (email) form.append('email', email)
      if (anschreiben) form.append('anschreiben', anschreiben)
      if (file) form.append('lebenslauf', file)

      const res  = await fetch('/api/bewerbung', { method: 'POST', body: form })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error ?? 'Fehler beim Absenden')
      }
    } catch {
      setError('Verbindungsfehler')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={LABEL}>Name *</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Max Mustermann" required style={INPUT}
          />
        </div>
        <div>
          <label style={LABEL}>Telefon *</label>
          <input
            value={telefon} onChange={e => setTelefon(e.target.value)}
            placeholder="+49 123 456789" required style={INPUT}
          />
        </div>
      </div>

      {/* Extra fields — always visible on desktop, collapsible on compact/mobile */}
      {compact ? (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setShowExtra(p => !p)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#666', padding: 0, marginBottom: 8,
              textDecoration: 'underline',
            }}
          >
            {showExtra ? '▲ Weniger' : '▼ Weitere Angaben (optional)'}
          </button>
          {showExtra && <ExtraFields
            email={email} setEmail={setEmail}
            anschreiben={anschreiben} setAnschreiben={setAnschreiben}
            setFile={setFile}
          />}
        </div>
      ) : (
        <ExtraFields
          email={email} setEmail={setEmail}
          anschreiben={anschreiben} setAnschreiben={setAnschreiben}
          setFile={setFile}
        />
      )}

      {error && (
        <div style={{
          padding: '9px 12px', borderRadius: 8,
          background: '#fef2f2', border: '1px solid #fecaca',
          fontSize: 12, color: '#dc2626', marginBottom: 12,
        }}>
          ✗ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          padding: compact ? '16px 0' : '13px 0',
          background: submitting ? '#f5f5f5' : ORANGE,
          color: submitting ? '#bbb' : '#fff',
          borderRadius: 9, border: 'none',
          fontSize: compact ? 18 : 15,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.01em',
        }}
      >
        {submitting ? 'Wird gesendet…' : 'Jetzt bewerben →'}
      </button>

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
        Kein Account nötig. Deine Daten werden nur<br />
        an {firma} weitergeleitet.
      </div>
    </form>
  )
}

function ExtraFields({
  email, setEmail, anschreiben, setAnschreiben, setFile,
}: {
  email: string
  setEmail: (v: string) => void
  anschreiben: string
  setAnschreiben: (v: string) => void
  setFile: (f: File | null) => void
}) {
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL}>E-Mail (optional)</label>
        <input
          value={email} onChange={e => setEmail(e.target.value)}
          type="email" placeholder="max@email.de" style={INPUT}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL}>Erzähl uns kurz von dir (optional)</label>
        <textarea
          value={anschreiben} onChange={e => setAnschreiben(e.target.value)}
          placeholder="Was bringst du mit? Warum passt du zu dieser Stelle?"
          rows={4}
          style={{ ...INPUT, resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Lebenslauf (optional, max. 5 MB)</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          style={{ ...INPUT, padding: '7px 12px' }}
        />
      </div>
    </>
  )
}

export default function JobDetailClient({ job }: { job: Job }) {
  const firma  = job.firmen_profile?.firmenname ?? 'Unbekannt'
  const color  = avatarColor(firma)
  const init   = initials(firma)
  const isPro  = ['business', 'enterprise', 'lifetime'].includes(job.firmen_profile?.plan ?? '')
  const isVerified = isPro || job.firmen_profile?.verified === true

  const [success,     setSuccess]     = useState(false)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modalOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  const SuccessScreen = () => (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8, letterSpacing: '-0.03em' }}>
        Bewerbung gesendet!
      </div>
      <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
        <strong>{firma}</strong> wird sich bei dir melden.
      </div>
    </div>
  )

  return (
    <div>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#fff',
        borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 32px', height: 56,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#18181b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>QR-Docs Jobs</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Alle Jobs</a>
      </nav>

      {/* Desktop layout: 2-col grid */}
      <div style={{
        maxWidth: 1000, margin: '0 auto', padding: '32px',
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: '1fr 320px', gap: 24,
      }}>

        {/* LEFT: Job detail */}
        <div style={{ paddingBottom: isMobile ? '80px' : 0 }}>
          {/* Header card */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: color + '1a', border: `2px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color, flexShrink: 0,
              }}>
                {init}
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em', color: '#111' }}>
                  {job.titel}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: '#666' }}>{firma}</span>
                  {isVerified && (
                    <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>✓ QR-Docs verifiziert</span>
                  )}
                  {job.is_featured && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#faeeda', color: '#854F0B', padding: '2px 6px', borderRadius: 4 }}>
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[job.stellenart, job.branche, job.standort].filter(Boolean).map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#f5f5f5', color: '#555', border: '1px solid #e5e5e5' }}>
                  {t}
                </span>
              ))}
              {(job.skills ?? []).map(s => (
                <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                  {s}
                </span>
              ))}
            </div>

            {(job.gehalt_min || job.gehalt_max) && (
              <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 700 }}>
                {job.gehalt_min && job.gehalt_max
                  ? `${job.gehalt_min.toLocaleString('de')}–${job.gehalt_max.toLocaleString('de')} €/Monat`
                  : `ab ${job.gehalt_min?.toLocaleString('de')} €/Monat`}
              </div>
            )}
          </div>

          {/* Description card */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              Stellenbeschreibung
            </div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {job.beschreibung}
            </div>
          </div>

          {/* Desktop application form (hidden on mobile) */}
          {!isMobile && (
            <div style={CARD}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 18 }}>
                Jetzt bewerben
              </div>
              {success ? (
                <SuccessScreen />
              ) : (
                <BewerbungForm job={job} onSuccess={() => setSuccess(true)} />
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Firma info (desktop only) */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={CARD}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
                Über das Unternehmen
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: color + '1a', border: `1.5px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color, flexShrink: 0,
                }}>
                  {init}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{firma}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{job.firmen_profile?.branche}</div>
                </div>
              </div>
              {[
                { label: 'Standort',  value: [job.firmen_profile?.strasse, job.firmen_profile?.plz, job.firmen_profile?.standort].filter(Boolean).join(', ') },
                { label: 'Branche',   value: job.firmen_profile?.branche },
                { label: 'Ausgeschrieben', value: formatDate(job.created_at) },
              ].filter(r => r.value).map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f5f5f5', fontSize: 12 }}>
                  <span style={{ color: '#aaa' }}>{r.label}</span>
                  <span style={{ color: '#333', fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
              {isVerified && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  ✓ Verifiziertes QR-Docs Unternehmen
                </div>
              )}
            </div>

            <div style={{ ...CARD, background: '#f8f8f7' }}>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
                Dieses Unternehmen nutzt QR-Docs für digitale Dokumentenverwaltung und Qualitätssicherung.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE: Sticky "Jetzt bewerben" button ── */}
      {isMobile && !success && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: '#fff', borderTop: '1px solid #e5e5e5',
          padding: '12px 16px',
        }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              width: '100%', padding: '16px 0',
              background: ORANGE, color: '#fff',
              borderRadius: 12, border: 'none',
              fontSize: 18, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '-0.01em',
            }}
          >
            Jetzt bewerben →
          </button>
        </div>
      )}

      {/* ── MOBILE: Slide-up modal ── */}
      {isMobile && modalOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 40px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: '#e5e5e5', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>{job.titel}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 18 }}>{firma}</div>

            {success ? (
              <>
                <SuccessScreen />
                <button
                  onClick={() => { setModalOpen(false) }}
                  style={{
                    marginTop: 16, width: '100%', padding: '12px 0',
                    background: '#f5f5f5', color: '#555',
                    borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Schließen
                </button>
              </>
            ) : (
              <BewerbungForm
                job={job}
                onSuccess={() => setSuccess(true)}
                compact
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
