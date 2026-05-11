import { getAdminClient } from '@/lib/supabase/server'
import { Metadata }     from 'next'
import JobSearchClient  from './JobSearchClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Jobs für KMU & Handwerk | QR-Docs Jobs',
  description: 'Der Jobmarkt für kleine und mittlere Unternehmen. Echte Stellen, verifizierte Unternehmen — Handwerk, Gastronomie, Logistik und mehr.',
  alternates:  { canonical: 'https://jobs.qr-docs.de' },
}

const faqSchema = {
  '@context':  'https://schema.org',
  '@type':     'FAQPage',
  mainEntity:  [
    {
      '@type':          'Question',
      name:             'Wie finde ich einen Job im Handwerk?',
      acceptedAnswer:   {
        '@type': 'Answer',
        text:    'Auf QR-Docs Jobs kannst du direkt nach Handwerk-Jobs filtern. Klicke auf "Handwerk" in der Branchenauswahl oder besuche jobs.qr-docs.de/jobs/handwerk. Alle Stellen stammen von verifizierten KMU.',
      },
    },
    {
      '@type':          'Question',
      name:             'Wie schalte ich eine Stellenanzeige?',
      acceptedAnswer:   {
        '@type': 'Answer',
        text:    'Melde dich mit deinem QR-Docs Konto an und klicke auf "+ Stelle ausschreiben". Du kannst Titel, Branche, Stellenart, Gehalt und Anforderungen angeben. Aktive Stellen erscheinen sofort in der Jobsuche.',
      },
    },
    {
      '@type':          'Question',
      name:             'Was kostet eine Stellenanzeige bei QR-Docs Jobs?',
      acceptedAnswer:   {
        '@type': 'Answer',
        text:    'Das Ausschreiben einer Stelle ist für QR-Docs Nutzer kostenlos. Business- und Enterprise-Kunden profitieren zusätzlich von Featured-Platzierungen und dem QR-Docs verifiziert Badge.',
      },
    },
  ],
}

export default async function HomePage() {
  const supabase = getAdminClient()

  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*')
    .eq('aktiv', true)
    .order('featured', { ascending: false })
    .order('created_at',  { ascending: false })
    .limit(50)

  const firmaIds = [...new Set((jobs ?? []).map(j => j.firma_id).filter(Boolean))]
  const { data: firmen } = firmaIds.length
    ? await supabase.from('firmen_profile').select('id, firmenname, branche, ort, plan').in('id', firmaIds)
    : { data: [] }
  const firmenMap = Object.fromEntries((firmen ?? []).map(f => [f.id, f]))
  const jobsMitFirma = (jobs ?? []).map(j => ({ ...j, firmen_profile: firmenMap[j.firma_id] ?? null }))

  const [{ count: jobCount }, { count: firmaCount }, { count: ausbildungCount }] = await Promise.all([
    supabase.from('job_listings').select('*',       { count: 'exact', head: true }).eq('aktiv', true),
    supabase.from('job_listings').select('firma_id',{ count: 'exact', head: true }).eq('aktiv', true),
    supabase.from('job_listings').select('*',       { count: 'exact', head: true }).eq('aktiv', true).eq('stellenart', 'Ausbildung'),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <JobSearchClient
        initialJobs={jobsMitFirma}
        stats={{ jobs: jobCount ?? 0, firmen: firmaCount ?? 0, ausbildung: ausbildungCount ?? 0 }}
      />
    </>
  )
}






