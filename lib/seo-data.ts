// ── SEO shared data ──────────────────────────────────────────────────────────

export interface BrancheInfo {
  label: string
  dbValue: string
  description: string
}

export const BRANCHEN_SEO: Record<string, BrancheInfo> = {
  handwerk: {
    label: 'Handwerk',
    dbValue: 'Handwerk',
    description: 'Tischler, Elektriker, Klempner und mehr: Handwerk Jobs bei verifizierten KMU bundesweit. Jetzt bewerben.',
  },
  'lager-logistik': {
    label: 'Lager & Logistik',
    dbValue: 'Logistik',
    description: 'Lagermitarbeiter, Gabelstaplerfahrer, Disponenten – Jobs in Lager & Logistik bei verifizierten Unternehmen.',
  },
  gastronomie: {
    label: 'Gastronomie',
    dbValue: 'Gastronomie',
    description: 'Koch, Servicekraft, Restaurantleiter: Gastronomie Jobs bei verifizierten Betrieben bundesweit.',
  },
  einzelhandel: {
    label: 'Einzelhandel',
    dbValue: 'Einzelhandel',
    description: 'Verkäufer, Filialleiter, Kassierer: Einzelhandel Jobs in deiner Nähe bei KMU.',
  },
  produktion: {
    label: 'Produktion',
    dbValue: 'Produktion',
    description: 'Maschinenführer, Produktionsmitarbeiter, Schichtleiter: Jobs in der Produktion bei verifizierten Betrieben.',
  },
  gesundheit: {
    label: 'Gesundheit',
    dbValue: 'Gesundheit',
    description: 'Pflegekräfte, Ärzte, Therapeuten: Gesundheits-Jobs bei verifizierten Einrichtungen bundesweit.',
  },
}

export const STAEDTE: Record<string, string> = {
  muenchen:  'München',
  berlin:    'Berlin',
  hamburg:   'Hamburg',
  koeln:     'Köln',
  frankfurt: 'Frankfurt',
}

export const BRANCHEN_SLUGS = Object.keys(BRANCHEN_SEO)
export const STAEDTE_SLUGS  = Object.keys(STAEDTE)

export const STELLENART_SEO: Record<string, { dbValue: string; h1: string; title: string; description: string }> = {
  ausbildung: {
    dbValue:     'Ausbildung',
    h1:          'Ausbildungsplätze bei KMU & Handwerk',
    title:       'Ausbildung finden 2025 | QR-Docs Jobs',
    description: 'Freie Ausbildungsplätze bei KMU: Handwerk, Einzelhandel, Gastronomie und mehr. Jetzt bewerben auf QR-Docs Jobs.',
  },
  praktikum: {
    dbValue:     'Praktikum',
    h1:          'Praktikum bei KMU — Praxiserfahrung sammeln',
    title:       'Praktikum finden | QR-Docs Jobs',
    description: 'Praktikumsplätze bei KMU und Handwerksbetrieben. Sammel echte Praxiserfahrung und knüpfe Kontakte.',
  },
  minijob: {
    dbValue:     'Minijob',
    h1:          'Minijobs & 520-Euro-Jobs in deiner Nähe',
    title:       'Minijob finden | QR-Docs Jobs',
    description: 'Minijobs und 520-Euro-Jobs bei KMU: Einzelhandel, Gastronomie, Lager. Flexibel und direkt beim Arbeitgeber.',
  },
  teilzeit: {
    dbValue:     'Teilzeit',
    h1:          'Teilzeit Jobs — Flexibel arbeiten bei KMU',
    title:       'Teilzeit Jobs finden | QR-Docs Jobs',
    description: 'Teilzeitstellen bei mittelständischen Unternehmen: Handwerk, Büro, Handel. Jetzt Teilzeit Job finden.',
  },
}

