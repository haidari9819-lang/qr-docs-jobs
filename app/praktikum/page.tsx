import { Metadata }       from 'next'
import StellensartPage    from '@/app/_stellensart/StellensartPage'
import { STELLENART_SEO } from '@/lib/seo-data'

export const metadata: Metadata = {
  title:       STELLENART_SEO.praktikum.title,
  description: STELLENART_SEO.praktikum.description,
  alternates:  { canonical: 'https://jobs.qr-docs.de/praktikum' },
}

export default function PraktikumPage() {
  return <StellensartPage artSlug="praktikum" />
}
