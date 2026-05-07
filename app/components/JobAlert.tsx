'use client'
import { useState } from 'react'

interface Props {
  region?: string
  branche?: string
}

export default function JobAlert({ region, branche }: Props) {
  const [email,      setEmail]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  const filterLabel = [branche, region].filter(Boolean).join(' · ') || 'dieser Region'

  async function activate(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/job-alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, region, branche }),
      })
      const data = await res.json()
      if (data.success) {
        setDone(true)
      } else {
        setError(data.error ?? 'Fehler')
      }
    } catch {
      setError('Verbindungsfehler')
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: 14,
      padding: '24px 20px',
      marginTop: 8,
    }}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            Job-Alert aktiviert!
          </div>
          <div style={{ fontSize: 13, color: '#666' }}>
            Wir schreiben dir sobald neue Stellen für <strong>{filterLabel}</strong> da sind.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 26 }}>📬</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                Keine Stellen? Job-Alert aktivieren
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                Wir benachrichtigen dich sobald neue Stellen in {filterLabel} verfügbar sind.
              </div>
            </div>
          </div>

          <form onSubmit={activate} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              style={{
                flex: 1, padding: '9px 12px',
                border: '1px solid #e5e5e5', borderRadius: 8,
                fontSize: 13, color: '#111', background: '#fafafa',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 16px', background: loading ? '#f5f5f5' : '#18181b',
                color: loading ? '#bbb' : '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? '…' : 'Aktivieren'}
            </button>
          </form>

          {(branche || region) && (
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
              Für: {filterLabel}
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>✗ {error}</div>
          )}
        </>
      )}
    </div>
  )
}

