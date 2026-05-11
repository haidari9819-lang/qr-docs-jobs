'use client'
import { useState, useEffect, useRef } from 'react'

const ORANGE = '#e8521a'

interface Job {
  id: string
  titel: string
  standort?: string
  stellenart?: string
  branche?: string
  firmen_profile?: { firmenname: string }
}

export default function BewerbenClient({ job }: { job: Job }) {
  const firma = job.firmen_profile?.firmenname ?? 'das Unternehmen'

  const [name,        setName]        = useState('')
  const [telefon,     setTelefon]     = useState('')
  const [nachricht,   setNachricht]   = useState('')
  const [dateiName,   setDateiName]   = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')
  const [confetti,    setConfetti]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (success) {
      setConfetti(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200)
      const t = setTimeout(() => setConfetti(false), 4000)
      return () => clearTimeout(t)
    }
  }, [success])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !telefon) return
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('job_id',      job.id)
      form.append('name',        name)
      form.append('telefon',     telefon)
      form.append('anschreiben', nachricht)
      const file = fileRef.current?.files?.[0] ?? cameraRef.current?.files?.[0]
      if (file) form.append('lebenslauf', file)

      const res  = await fetch('/api/bewerbung', { method: 'POST', body: form })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error ?? 'Fehler')
      }
    } catch {
      setError('Verbindungsfehler')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#fff',
        padding: '32px 20px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Confetti */}
        {confetti && <ConfettiBlast />}

        <div style={{ textAlign: 'center', maxWidth: 360, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🎉</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 10px', letterSpacing: '-0.04em' }}>
            Bewerbung gesendet!
          </h1>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: '0 0 24px' }}>
            <strong>{firma}</strong> wird sich bei dir melden.
          </p>
          <div style={{ padding: '14px 20px', background: '#f8f8f7', borderRadius: 12, fontSize: 13, color: '#666' }}>
            Tipp: Halte dein Telefon bereit. Die meisten KMU melden sich innerhalb von 24h.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#fff', display: 'flex',
      flexDirection: 'column', padding: '32px 20px 48px',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header — nur Job-Titel, kein Nav */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-block', padding: '4px 10px',
          background: '#f5f5f5', borderRadius: 6,
          fontSize: 11, fontWeight: 600, color: '#888',
          marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {[job.stellenart, job.standort].filter(Boolean).join(' · ')}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 4px', letterSpacing: '-0.04em', lineHeight: 1.2 }}>
          {job.titel}
        </h1>
        <div style={{ fontSize: 14, color: '#888' }}>{firma}</div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Dein Name *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Max Mustermann"
            required
            autoFocus
            style={{
              width: '100%', padding: '14px 16px',
              border: '1.5px solid #e5e5e5', borderRadius: 10,
              fontSize: 16, color: '#111', background: '#fafafa',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Telefon */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Telefon *
          </label>
          <input
            value={telefon}
            onChange={e => setTelefon(e.target.value)}
            placeholder="+49 123 456789"
            type="tel"
            required
            style={{
              width: '100%', padding: '14px 16px',
              border: '1.5px solid #e5e5e5', borderRadius: 10,
              fontSize: 16, color: '#111', background: '#fafafa',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Nachricht */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Kurze Nachricht (optional)
          </label>
          <textarea
            value={nachricht}
            onChange={e => setNachricht(e.target.value)}
            placeholder="z.B. Wann kannst du anfangen?"
            rows={3}
            style={{
              width: '100%', padding: '14px 16px',
              border: '1.5px solid #e5e5e5', borderRadius: 10,
              fontSize: 16, color: '#111', background: '#fafafa',
              outline: 'none', resize: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Foto / Gesellenbrief */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Foto / Gesellenbrief (optional)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Upload from files */}
            <button type="button" onClick={() => fileRef.current?.click()} style={{
              flex: 1, padding: '12px 0', border: '1.5px dashed #e5e5e5', borderRadius: 10,
              background: dateiName ? '#f0fdf4' : '#fafafa', cursor: 'pointer',
              fontSize: 13, color: dateiName ? '#16a34a' : '#888', fontWeight: 500,
            }}>
              {dateiName ? `✓ ${dateiName.length > 20 ? dateiName.slice(0, 18) + '…' : dateiName}` : '📎 Datei'}
            </button>
            {/* Camera — opens device camera directly */}
            <button type="button" onClick={() => cameraRef.current?.click()} style={{
              width: 52, padding: '12px 0', border: '1.5px dashed #e5e5e5', borderRadius: 10,
              background: '#fafafa', cursor: 'pointer', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="Foto aufnehmen">
              📷
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
            onChange={e => setDateiName(e.target.files?.[0]?.name ?? '')} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => setDateiName(e.target.files?.[0]?.name ?? '')} />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 9,
            background: '#fef2f2', border: '1px solid #fecaca',
            fontSize: 13, color: '#dc2626',
          }}>
            ✗ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 'auto', padding: '18px 0',
            background: submitting ? '#f5f5f5' : ORANGE,
            color: submitting ? '#bbb' : '#fff',
            borderRadius: 14, border: 'none',
            fontSize: 18, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em',
            minHeight: 56,
          }}
        >
          {submitting ? 'Wird gesendet…' : 'Bewerben →'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#bbb', lineHeight: 1.5 }}>
          Kein Account nötig · Daten werden nur an {firma} weitergeleitet
        </div>
      </form>
    </div>
  )
}

// Simple CSS confetti animation
function ConfettiBlast() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left:  Math.random() * 100,
    delay: Math.random() * 0.8,
    color: ['#E05C1A','#22c55e','#6366f1','#f59e0b','#ec4899'][i % 5],
    size:  6 + Math.random() * 8,
  }))

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: 0,
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : 2,
          animation: `confetti-fall 2.5s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  )
}

