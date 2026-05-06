'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') || '/ausschreiben'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'E-Mail oder Passwort falsch.'
        : authError.message)
      setLoading(false)
      return
    }

    // Session set on this domain — go to target
    router.push(redirectTo)
    router.refresh()
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '10px 13px', boxSizing: 'border-box',
    border: '1px solid #e5e5e5', borderRadius: 9,
    fontSize: 14, color: '#111', background: '#fafafa',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f5f4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e5e5e5', borderRadius: 16,
        padding: '36px 32px', width: '100%', maxWidth: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, background: '#18181b', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>QR-Docs Jobs</div>
            <div style={{ fontSize: 11, color: '#999' }}>Anmelden um fortzufahren</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dein@email.de"
              required
              autoFocus
              style={INPUT}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={INPUT}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 13px', borderRadius: 8, marginBottom: 16,
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: 13, color: '#dc2626', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '11px 0',
              background: loading || !email || !password ? '#f5f5f5' : '#18181b',
              color: loading || !email || !password ? '#bbb' : '#fff',
              borderRadius: 9, border: 'none',
              fontSize: 14, fontWeight: 700,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all .14s',
            }}
          >
            {loading ? 'Anmelden…' : 'Anmelden →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#999' }}>
          Noch kein Konto?{' '}
          <a href="https://www.qr-docs.de/auth/register" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
            Kostenlos registrieren
          </a>
        </div>

        <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#bbb' }}>
          <a href="https://www.qr-docs.de/auth/forgot-password" style={{ color: '#bbb', textDecoration: 'none' }}>
            Passwort vergessen?
          </a>
        </div>
      </div>
    </div>
  )
}

// Suspense boundary required for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
        Laden…
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
