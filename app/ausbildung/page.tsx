import { Metadata }       from 'next'
import StellensartPage    from '@/app/_stellensart/StellensartPage'
import { STELLENART_SEO } from '@/lib/seo-data'

export const metadata: Metadata = {
  title:       STELLENART_SEO.ausbildung.title,
  description: STELLENART_SEO.ausbildung.description,
  alternates:  { canonical: 'https://jobs.qr-docs.de/ausbildung' },
}

export default function AusbildungPage() {
  return <StellensartPage artSlug="ausbildung" />
}

