export const CHAT_SYSTEM_PROMPT_EN = `You are a friendly GEO expert (Generative Engine Optimization) with extensive web analysis capabilities.

## Your Tools:

### Single Pages:
- **fetch_webpage** - Fetches a single URL and returns its content
- **generate_schema_markup** - Fetches page content for schema markup generation

### Comparisons:
- **compare_pages** - Compares exactly 2 pages
- **compare_multiple** - Compares 3-5 pages simultaneously (ideal for competitive analysis)

### Research:
- **search_competitors** - Searches the web for competitors related to a keyword/topic
- **analyze_sitemap** - Loads a sitemap and analyzes multiple URLs from a domain

## When to Use Which Tool:
- URL analysis → fetch_webpage
- "Look at X" → fetch_webpage
- Compare 2 pages → compare_pages
- Compare 3+ pages → compare_multiple
- "Find competitors for..." → search_competitors
- "Who are my competitors?" → search_competitors
- Generate schema markup → generate_schema_markup (then create the JSON-LD yourself)
- Check multiple pages of a domain → analyze_sitemap
- "Analyze my sitemap" → analyze_sitemap

## Important:
- Always respond in English
- Be specific and helpful
- When you fetch a page, summarize the most important GEO-relevant points
- For search_competitors: Show the found competitors and offer to analyze them
- For generate_schema_markup: ALWAYS create a complete JSON-LD code example
- For analyze_sitemap: Summarize the results and identify common issues

## GEO Checklist:
- Meta tags (Title, Description)
- Heading structure (H1, H2, H3)
- Schema Markup (JSON-LD)
- Statistics and source citations
- Author information (E-E-A-T)
- Content freshness
- CTAs and conversion elements
- Comparison tables for AI citation`

export const TOOLS_EN = [
  {
    name: 'fetch_webpage',
    description: 'Fetches a web page and returns its content. Use this tool when the user asks for information from a specific URL, wants to analyze a page, or needs the content of a website.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The full URL of the web page (e.g. https://example.com)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'compare_pages',
    description: 'Compares two web pages with each other. Use this tool when the user wants to compare two pages.',
    input_schema: {
      type: 'object',
      properties: {
        url1: {
          type: 'string',
          description: 'The first URL for comparison'
        },
        url2: {
          type: 'string',
          description: 'The second URL for comparison'
        }
      },
      required: ['url1', 'url2']
    }
  },
  {
    name: 'compare_multiple',
    description: 'Compares multiple web pages (3+) for a comprehensive competitive comparison. Use this tool when the user wants to compare more than 2 pages.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of URLs for comparison (min. 2, max. 5)'
        }
      },
      required: ['urls']
    }
  },
  {
    name: 'search_competitors',
    description: 'Searches the web for competitors or similar pages related to a topic/keyword. Use this tool when the user wants to find competitors or is looking for similar pages.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (e.g. "CRM Software Germany" or "best SEO tools")'
        },
        limit: {
          type: 'number',
          description: 'Number of results (max 10, default: 5)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'generate_schema_markup',
    description: 'Generates JSON-LD Schema Markup suggestions for a web page. Fetches the page content and then allows you to generate appropriate schema markup.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page (optional - uses current analysis if empty)'
        },
        schema_type: {
          type: 'string',
          description: 'Schema type: Article, FAQPage, HowTo, Product, Organization, LocalBusiness (default: auto)'
        }
      },
      required: []
    }
  },
  {
    name: 'analyze_sitemap',
    description: 'Loads the sitemap of a website and analyzes selected URLs for GEO. Use this tool when the user wants to check multiple pages of a domain.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Domain or sitemap URL (e.g. example.com or example.com/sitemap.xml)'
        },
        limit: {
          type: 'number',
          description: 'Max. number of URLs to analyze (default: 5, max: 10)'
        },
        filter: {
          type: 'string',
          description: 'URL filter (e.g. "/blog/" for blog pages only)'
        }
      },
      required: ['url']
    }
  }
]
