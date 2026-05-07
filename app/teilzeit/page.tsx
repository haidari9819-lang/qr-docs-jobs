import { Metadata }       from 'next'
import StellensartPage    from '@/app/_stellensart/StellensartPage'
import { STELLENART_SEO } from '@/lib/seo-data'

export const metadata: Metadata = {
  title:       STELLENART_SEO.teilzeit.title,
  description: STELLENART_SEO.teilzeit.description,
  alternates:  { canonical: 'https://jobs.qr-docs.de/teilzeit' },
}

export default function TeilzeitPage() {
  return <StellensartPage artSlug="teilzeit" />
}

