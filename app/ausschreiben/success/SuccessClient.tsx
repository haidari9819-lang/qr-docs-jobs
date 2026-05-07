'use client'
import { useSearchParams } from 'next/navigation'

export default function SuccessClient() {
  const params = useSearchParams()
  const jobId  = params.get('job_id')

  const base        = typeof window !== 'undefined' ? window.location.origin : 'https://jobs.qr-docs.de'
  const bewerbenUrl = jobId ? `${base}/bewerben/${jobId}` : null
  const qrUrl       = bewerbenUrl ? `/api/qr?url=${encodeURIComponent(bewerbenUrl)}&size=280` : null

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          Premium-Inserat aktiviert!
        </h1>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 32, lineHeight: 1.6 }}>
          Zahlung erfolgreich. Deine Stelle erscheint jetzt als Featured ganz oben in den Suchergebnissen.
        </p>

        {qrUrl && (
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>QR-Code für Aushang</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 18 }}>
              Ausdrucken und an Baustelle / im Betrieb aufhängen.
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR-Code"
              style={{ width: 200, height: 200, margin: '0 auto 18px', display: 'block', borderRadius: 8, border: '1px solid #e5e5e5' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`/api/qr?url=${encodeURIComponent(bewerbenUrl!)}&size=600`}
                download="qr-bewerbung.png"
                style={{ padding: '9px 18px', background: '#E05C1A', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                ↓ QR-Code herunterladen
              </a>
              <a
                href={bewerbenUrl!}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '9px 18px', background: '#f5f5f4', border: '1px solid #e5e5e5', color: '#111', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                Bewerbungslink ↗
              </a>
            </div>
          </div>
        )}

        <a href="/dashboard/jobs" style={{ display: 'inline-block', padding: '11px 24px', background: '#18181b', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Zum Dashboard →
        </a>
      </div>
    </div>
  )
}

