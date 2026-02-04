export const CHAT_SYSTEM_PROMPT_DE = `Du bist ein freundlicher GEO-Experte (Generative Engine Optimization) mit umfangreichen Fähigkeiten zur Webanalyse.

## Deine Tools:

### Einzelseiten:
- **fetch_webpage** - Lädt eine einzelne URL und gibt den Inhalt zurück
- **generate_schema_markup** - Holt Seiteninhalt für Schema-Markup-Generierung

### Vergleiche:
- **compare_pages** - Vergleicht genau 2 Seiten
- **compare_multiple** - Vergleicht 3-5 Seiten gleichzeitig (ideal für Wettbewerbsanalyse)

### Recherche:
- **search_competitors** - Sucht im Web nach Konkurrenten zu einem Keyword/Thema
- **analyze_sitemap** - Lädt Sitemap und analysiert mehrere URLs einer Domain

## Wann welches Tool:
- URL-Analyse → fetch_webpage
- "Schau dir X an" → fetch_webpage
- 2 Seiten vergleichen → compare_pages
- 3+ Seiten vergleichen → compare_multiple
- "Finde Konkurrenten für..." → search_competitors
- "Wer sind meine Wettbewerber?" → search_competitors
- Schema Markup generieren → generate_schema_markup (dann selbst das JSON-LD erstellen)
- Mehrere Seiten einer Domain prüfen → analyze_sitemap
- "Analysiere meine Sitemap" → analyze_sitemap

## Wichtig:
- Antworte IMMER auf Deutsch
- Sei konkret und hilfreich
- Wenn du eine Seite abrufst, fasse die wichtigsten GEO-relevanten Punkte zusammen
- Bei search_competitors: Zeige die gefundenen Konkurrenten und biete an, sie zu analysieren
- Bei generate_schema_markup: Erstelle IMMER ein vollständiges JSON-LD Codebeispiel
- Bei analyze_sitemap: Fasse die Ergebnisse zusammen und identifiziere gemeinsame Probleme

## GEO-Checkliste:
- Meta-Tags (Title, Description)
- Überschriften-Struktur (H1, H2, H3)
- Schema Markup (JSON-LD)
- Statistiken und Quellenangaben
- Autor-Informationen (E-E-A-T)
- Aktualität der Inhalte
- CTAs und Conversion-Elemente
- Vergleichstabellen für AI-Zitation`

export const TOOLS_DE = [
  {
    name: 'fetch_webpage',
    description: 'Ruft eine Webseite ab und gibt den Inhalt zurück. Nutze dieses Tool wenn der Nutzer nach Informationen von einer bestimmten URL fragt, eine Seite analysieren möchte, oder Inhalte einer Webseite benötigt.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Die vollständige URL der Webseite (z.B. https://example.com)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'compare_pages',
    description: 'Vergleicht zwei Webseiten miteinander. Nutze dieses Tool wenn der Nutzer zwei Seiten vergleichen möchte.',
    input_schema: {
      type: 'object',
      properties: {
        url1: {
          type: 'string',
          description: 'Die erste URL zum Vergleich'
        },
        url2: {
          type: 'string',
          description: 'Die zweite URL zum Vergleich'
        }
      },
      required: ['url1', 'url2']
    }
  },
  {
    name: 'compare_multiple',
    description: 'Vergleicht mehrere Webseiten (3+) miteinander für einen umfassenden Wettbewerbsvergleich. Nutze dieses Tool wenn der Nutzer mehr als 2 Seiten vergleichen möchte.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Liste von URLs zum Vergleich (mind. 2, max. 5)'
        }
      },
      required: ['urls']
    }
  },
  {
    name: 'search_competitors',
    description: 'Sucht im Web nach Konkurrenten oder ähnlichen Seiten zu einem Thema/Keyword. Nutze dieses Tool wenn der Nutzer Wettbewerber finden möchte oder nach ähnlichen Seiten sucht.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Suchbegriff (z.B. "CRM Software Deutschland" oder "beste SEO Tools")'
        },
        limit: {
          type: 'number',
          description: 'Anzahl Ergebnisse (max 10, Standard: 5)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'generate_schema_markup',
    description: 'Generiert JSON-LD Schema Markup Vorschläge für eine Webseite. Holt den Seiteninhalt und ermöglicht dir dann, passendes Schema Markup zu generieren.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL der Seite (optional - nutzt aktuelle Analyse wenn leer)'
        },
        schema_type: {
          type: 'string',
          description: 'Schema-Typ: Article, FAQPage, HowTo, Product, Organization, LocalBusiness (Standard: auto)'
        }
      },
      required: []
    }
  },
  {
    name: 'analyze_sitemap',
    description: 'Lädt die Sitemap einer Website und analysiert ausgewählte URLs für GEO. Nutze dieses Tool wenn der Nutzer mehrere Seiten einer Domain prüfen möchte.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Domain oder Sitemap-URL (z.B. example.com oder example.com/sitemap.xml)'
        },
        limit: {
          type: 'number',
          description: 'Max. Anzahl URLs zu analysieren (Standard: 5, max: 10)'
        },
        filter: {
          type: 'string',
          description: 'URL-Filter (z.B. "/blog/" für nur Blog-Seiten)'
        }
      },
      required: ['url']
    }
  }
]
