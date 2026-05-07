'use client'
import { useState } from 'react'
import { BRANCHEN, STELLENARTEN, ALL_SKILLS } from '@/lib/helpers'

interface Profil {
  id: string
  firmenname: string
  branche?: string
  standort?: string
  plan?: string
}

interface Props {
  profil: Profil | null
  userId: string
}

const LABEL: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: '#aaa', textTransform: 'uppercase', display: 'block', marginBottom: 5 }
const INPUT: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, color: '#111', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }

const PLANS = [
  {
    id:       'kostenlos',
    label:    'Kostenlos',
    price:    '0 €',
    sub:      '30 Tage',
    features: ['Standard-Platzierung', '30 Tage aktiv', 'Unbegrenzte Bewerbungen'],
    featured: false,
    stripe:   null,
  },
  {
    id:       'premium',
    label:    'Premium',
    price:    '49 €',
    sub:      '60 Tage · einmalig',
    features: ['⭐ Featured Badge', 'Oben in Suchergebnissen', '60 Tage aktiv', 'Mehr Sichtbarkeit'],
    featured: true,
    stripe:   process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM,
  },
]

export default function AusschreibenClient({ profil, userId }: Props) {
  const [plan,         setPlan]         = useState<'kostenlos' | 'premium'>('kostenlos')
  const [titel,        setTitel]        = useState('')
  const [stellenart,   setStellenart]   = useState('Vollzeit')
  const [branche,      setBranche]      = useState(profil?.branche ?? '')
  const [standort,     setStandort]     = useState(profil?.standort ?? '')
  const [beschreibung, setBeschreibung] = useState('')
  const [gehaltMin,    setGehaltMin]    = useState('')
  const [gehaltMax,    setGehaltMax]    = useState('')
  const [skills,       setSkills]       = useState<string[]>([])
  const [saving,       setSaving]       = useState(false)
  const [newJobId,     setNewJobId]     = useState<string | null>(null)
  const [error,        setError]        = useState('')

  function toggleSkill(s: string) {
    setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!titel || !standort || !beschreibung || !profil) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/jobs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          titel, stellenart, branche, standort, beschreibung,
          gehalt_min:  gehaltMin ? Number(gehaltMin) : null,
          gehalt_max:  gehaltMax ? Number(gehaltMax) : null,
          skills,
          is_featured: plan === 'premium',
          preis_typ:   plan,
          firma_id:    profil.id,
          user_id:     userId,
        }),
      })
      const data = await res.json()
      if (data.success && data.id) {
        setNewJobId(data.id)
        // If premium, redirect to Stripe Checkout
        if (plan === 'premium') {
          const checkoutRes = await fetch('/api/stripe/checkout', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ job_id: data.id, plan: 'premium' }),
          })
          const checkoutData = await checkoutRes.json()
          if (checkoutData.url) {
            window.location.href = checkoutData.url
            return
          }
        }
      } else {
        setError(data.error ?? 'Fehler')
      }
    } catch {
      setError('Verbindungsfehler')
    }
    setSaving(false)
  }

  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://jobs.qr-docs.de'
  const bewerbenUrl = newJobId ? `${BASE}/bewerben/${newJobId}` : null
  const qrUrl       = bewerbenUrl ? `/api/qr?url=${encodeURIComponent(bewerbenUrl)}&size=280` : null

  // Success screen
  if (newJobId && plan !== 'premium') {
    return (
      <div>
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: '#18181b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>QR-Docs Jobs</span>
          </a>
        </nav>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
            Stelle veröffentlicht!
          </h1>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 32 }}>
            Deine Stelle ist jetzt live. Bewerber können sich direkt bewerben — ohne Account.
          </p>

          {/* QR Code */}
          {qrUrl && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 16, padding: '28px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                QR-Code für Aushang & Baustelle
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
                Bewerber scannen den Code und landen direkt auf dem Bewerbungsformular.
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR-Code Bewerbungslink"
                style={{ width: 200, height: 200, borderRadius: 8, margin: '0 auto 20px', display: 'block', border: '1px solid #e5e5e5' }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={qrUrl + '&size=600'}
                  download="qr-bewerbung.png"
                  style={{
                    padding: '9px 18px', background: '#18181b', color: '#fff',
                    borderRadius: 8, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  ↓ QR-Code herunterladen
                </a>
                <a
                  href={bewerbenUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '9px 18px', background: '#f5f5f4',
                    border: '1px solid #e5e5e5', color: '#111',
                    borderRadius: 8, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  Bewerbungslink öffnen ↗
                </a>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="/dashboard/jobs" style={{ padding: '10px 20px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Zum Dashboard →
            </a>
            <a href="/" style={{ padding: '10px 20px', background: '#f5f5f4', border: '1px solid #e5e5e5', color: '#111', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Alle Jobs ansehen
            </a>
          </div>
        </div>
      </div>
    )
  }

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
          <a href="/dashboard/jobs" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Meine Jobs</a>
          <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>← Alle Jobs</a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em', color: '#111' }}>Stelle ausschreiben</h1>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Nach der Veröffentlichung erhältst du automatisch einen QR-Code zum Ausdrucken.</p>
        </div>

        {!profil && (
          <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
            Kein Firmenprofil gefunden. Bitte erstelle zuerst ein Profil im QR-Docs Dashboard.
          </div>
        )}

        {profil && (
          <div style={{ background: '#f8f8f7', border: '1px solid #e5e5e5', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Ausschreiber</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{profil.firmenname}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{profil.branche} · {profil.standort}</div>
          </div>
        )}

        {/* ── Plan wählen ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Plan wählen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {PLANS.map(p => {
              const active = plan === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id as 'kostenlos' | 'premium')}
                  style={{
                    padding: '16px 18px', textAlign: 'left',
                    border: `2px solid ${active ? '#18181b' : '#e5e5e5'}`,
                    borderRadius: 12, background: active ? '#18181b' : '#fff',
                    cursor: 'pointer', transition: 'all .12s',
                    position: 'relative',
                  }}
                >
                  {p.featured && (
                    <span style={{
                      position: 'absolute', top: -1, right: 12,
                      background: '#E05C1A', color: '#fff',
                      fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: '0 0 6px 6px',
                      letterSpacing: '0.05em',
                    }}>
                      EMPFOHLEN
                    </span>
                  )}
                  <div style={{ fontSize: 16, fontWeight: 800, color: active ? '#fff' : '#111', marginBottom: 2 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: active ? '#a1a1aa' : '#888', marginBottom: 10 }}>{p.sub}</div>
                  {p.features.map(f => (
                    <div key={f} style={{ fontSize: 12, color: active ? '#d4d4d8' : '#555', marginBottom: 3 }}>✓ {f}</div>
                  ))}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={submit}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={LABEL}>Titel *</label>
              <input value={titel} onChange={e => setTitel(e.target.value)} placeholder="z.B. Lagermitarbeiter (m/w/d)" required style={INPUT} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={LABEL}>Stellenart</label>
                <select value={stellenart} onChange={e => setStellenart(e.target.value)} style={INPUT}>
                  {STELLENARTEN.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Branche</label>
                <select value={branche} onChange={e => setBranche(e.target.value)} style={INPUT}>
                  <option value="">Branche wählen</option>
                  {BRANCHEN.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={LABEL}>Standort *</label>
              <input value={standort} onChange={e => setStandort(e.target.value)} placeholder="z.B. München, Bayern" required style={INPUT} />
            </div>

            <div>
              <label style={LABEL}>Stellenbeschreibung *</label>
              <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Aufgaben, Anforderungen, Benefits…" rows={8} required style={{ ...INPUT, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={LABEL}>Gehalt Min (€/Monat)</label>
                <input value={gehaltMin} onChange={e => setGehaltMin(e.target.value)} type="number" placeholder="2800" style={INPUT} />
              </div>
              <div>
                <label style={LABEL}>Gehalt Max (€/Monat)</label>
                <input value={gehaltMax} onChange={e => setGehaltMax(e.target.value)} type="number" placeholder="3400" style={INPUT} />
              </div>
            </div>

            <div>
              <label style={LABEL}>Skill-Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_SKILLS.map(s => {
                  const active = skills.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} style={{
                      padding: '4px 10px', borderRadius: 99,
                      border: `1px solid ${active ? '#18181b' : '#e5e5e5'}`,
                      background: active ? '#18181b' : '#fff',
                      fontSize: 11, fontWeight: 600,
                      color: active ? '#fff' : '#666',
                      cursor: 'pointer',
                    }}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626' }}>
                ✗ {error}
              </div>
            )}

            <button type="submit" disabled={saving || !profil} style={{
              padding: '13px 0',
              background: saving || !profil ? '#f5f5f5' : plan === 'premium' ? '#E05C1A' : '#18181b',
              color: saving || !profil ? '#bbb' : '#fff',
              borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 700,
              cursor: saving || !profil ? 'not-allowed' : 'pointer',
            }}>
              {saving
                ? 'Wird veröffentlicht…'
                : plan === 'premium'
                ? '→ Weiter zu Stripe (€49)'
                : '+ Stelle kostenlos veröffentlichen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
