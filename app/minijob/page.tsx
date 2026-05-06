import { Metadata }       from 'next'
import StellensartPage    from '@/app/_stellensart/StellensartPage'
import { STELLENART_SEO } from '@/lib/seo-data'

export const metadata: Metadata = {
  title:       STELLENART_SEO.minijob.title,
  description: STELLENART_SEO.minijob.description,
  alternates:  { canonical: 'https://jobs.qr-docs.de/minijob' },
}

export default function MinijobPage() {
  return <StellensartPage artSlug="minijob" />
}
