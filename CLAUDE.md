# Sage GEO Agent - Project Documentation

## Overview

Sage GEO Agent is a web application that analyzes websites for **Generative Engine Optimization (GEO)** - the practice of optimizing content to be cited by AI systems like ChatGPT, Perplexity, and Google AI Overviews.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                        │
│  client/src/                                                 │
│  ├── components/     UI components                          │
│  ├── pages/          Page views                             │
│  └── App.jsx         Main app with routing                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Server (Express)                       │
│  server/                                                     │
│  ├── index.js        Entry point, route registration        │
│  ├── routes/         API endpoints                          │
│  └── services/       Business logic                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ├── Firecrawl      Web scraping (optional, handles bots)   │
│  ├── Claude API     AI analysis via Anthropic               │
│  └── SQLite         Local database (better-sqlite3)         │
└─────────────────────────────────────────────────────────────┘
```

## Core Services

### `/server/services/scraperService.js`
- **Purpose**: Fetches and parses web page content
- **Key Functions**:
  - `fetchPageContent(url)` - Main scraping function (uses Firecrawl if available)
  - `extractTextContent(html)` - Parses HTML for headings, text, structure analysis
  - `extractRobotsMeta($)` - Extracts noindex/nofollow meta directives
- **Note**: Removes hidden elements before H1 counting to avoid false positives

### `/server/services/aiService.js`
- **Purpose**: Analyzes pages with Claude AI for GEO scoring
- **Key Functions**:
  - `analyzeWithClaude()` - Main analysis function, returns JSON with score/recommendations
  - `parseRobotsTxt()` - Parses robots.txt into structured blocks
  - `isCrawlerBlocked()` - Checks if AI crawlers are blocked
- **System Prompt**: Contains GEO scoring criteria based on Princeton GEO-BENCH study
- **Scoring**: 100 points total across Content Quality, Structure, Schema, E-E-A-T, Actuality

### `/server/services/serpService.js`
- **Purpose**: SERP Click-Worthiness Analysis
- **Key Functions**:
  - `analyzeSerpFactors()` - Analyzes title, description, schema for SERP performance
  - `analyzePriceSchema()` - Validates Product/Offer schema for e-commerce pages
- **Metrics**: Title quality, description quality, B2B signals, trust triggers, feature clarity

### `/server/services/dbService.js`
- **Purpose**: SQLite database operations
- **Tables**:
  - `analyses` - Stored analysis results
  - `chat_messages` - Follow-up chat history per analysis
  - `recommendation_stats` - Global learning system for recommendation effectiveness
  - `monitored_urls` - URLs being monitored for score changes
  - `score_alerts` - Notifications for score changes
  - `geo_references` - External GEO sources (research, news, competitors)
  - `geo_reference_alerts` - Notifications for external source changes

### `/server/services/schedulerService.js`
- **Purpose**: Periodic checks of GEO references
- **Key Functions**:
  - `startScheduler()` - Starts hourly check cycle
  - `runGeoReferenceChecks()` - Checks all due references for content changes
  - `getRecommendedGeoReferences()` - Returns predefined GEO sources (Princeton, Moz, etc.)

### `/server/services/firecrawlService.js`
- **Purpose**: Integration with Firecrawl API for scraping
- **Requires**: `FIRECRAWL_API_KEY` environment variable
- **Benefits**: Handles bot protection, provides screenshots, better HTML extraction

## API Endpoints

### Analysis
- `POST /api/analyze` - Analyze a URL for GEO score
- `GET /api/history` - Get analysis history
- `GET /api/history/:id` - Get specific analysis
- `DELETE /api/history/:id` - Delete analysis

### Chat
- `POST /api/chat/:analysisId` - Send follow-up question about analysis
- `GET /api/chat/:analysisId/messages` - Get chat history

### Monitoring
- `GET /api/monitor/urls` - Get monitored URLs
- `POST /api/monitor/urls` - Add URL to monitoring
- `DELETE /api/monitor/urls/:id` - Remove from monitoring
- `GET /api/monitor/alerts` - Get score change alerts

### GEO References
- `GET /api/references` - Get all GEO references
- `GET /api/references/recommended` - Get recommended sources
- `POST /api/references` - Add GEO reference
- `DELETE /api/references/:id` - Remove reference
- `GET /api/references/alerts` - Get reference change alerts
- `POST /api/references/scheduler/check` - Trigger manual check

### Comparison
- `GET /api/compare/:oldId/:newId` - Compare two analyses

### Feedback
- `POST /api/feedback/recommendation` - Record recommendation feedback

## Key Features

### GEO Score Calculation (100 Points)
1. **Content Quality & Citability (35 pts)**
   - Direct Answer in first 40-60 words
   - Statistics with sources
   - Unique information

2. **Structure & Formatting (25 pts)**
   - Correct heading hierarchy
   - Questions as H2s
   - Lists, TL;DR section

3. **Schema & Technical (20 pts)**
   - JSON-LD Schema Markup
   - Correct schema types
   - robots.txt allows AI crawlers

4. **E-E-A-T & Authority (15 pts)**
   - Author with bio
   - Publication/update dates
   - External links to authorities

5. **Actuality (5 pts)**
   - Current year references
   - "Updated on" dates

### Negative Factors (Score Deductions)
- noindex meta tag: -30 (CRITICAL)
- nofollow meta tag: -10
- Multiple H1s: -10
- Skipped heading levels: -5
- No Schema Markup: -15
- AI crawlers blocked: -20 (CRITICAL)
- No statistics: -10
- No sources: -10

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your_claude_api_key

# Optional
FIRECRAWL_API_KEY=your_firecrawl_key  # For better scraping
DATABASE_PATH=./server/db/analyses.db  # Custom DB location
PORT=3001                               # Server port
```

## Known Limitations

1. **Scraping**: Some sites with strong bot protection may block requests without Firecrawl
2. **robots.txt**: Parser handles basic rules but not complex wildcards/regex
3. **Image Analysis**: Requires screenshot from Firecrawl; fallback scraper has no screenshots
4. **Schema Validation**: Validates structure but not semantic correctness
5. **noindex Detection**: Only checks meta tags, not X-Robots-Tag HTTP headers

## Development

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Run development
npm run dev  # Starts both client and server

# Build for production
cd client && npm run build
cd ../server && npm start
```

## File Structure

```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app
│   └── package.json
├── server/                 # Express backend
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   ├── db/                # SQLite database file
│   └── index.js           # Server entry point
├── .env                   # Environment variables (not in git)
└── CLAUDE.md             # This file
```

## Recent Changes

### 2025-01-27
- Fixed H1 false-positive detection (excludes hidden elements)
- Fixed robots.txt parser (proper User-Agent block parsing)
- Added noindex/nofollow meta tag detection with scoring
- Added Schema Price Validation for Product/Offer
- Improved AI explanations ("why" for each weakness/recommendation)
- Added GEO References system for tracking external sources
- Added Scheduler for periodic reference checks
