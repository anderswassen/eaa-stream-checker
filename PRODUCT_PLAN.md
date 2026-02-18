# EAA Stream Checker — Product Plan

## 1. Problem Statement

The European Accessibility Act (EAA) came into enforcement on **June 28, 2025**. Streaming services across the EU must comply with **EN 301 549**, which goes beyond standard WCAG 2.1 AA requirements — it includes video-specific mandates around captions, audio description, and player accessibility (Clause 7). Existing content has until **June 2030** to reach full compliance.

**No single tool on the market today covers the full scope of EAA compliance for streaming services.** General accessibility checkers (axe-core, Lighthouse, WAVE) handle web content well but ignore video-specific requirements. Caption/subtitle tools validate file formats but don't assess player accessibility or generate EN 301 549-mapped reports.

This is the gap we fill.

---

## 2. Competitive Landscape

### General Accessibility Checkers (web content focus)

| Tool | Open Source | Pricing | EN 301 549 Mapping | Video/Streaming Checks |
|------|-----------|---------|--------------------|-----------------------|
| **axe-core** (Deque) | Yes (core) | Core free; enterprise paid | Partial (WCAG mapping) | No |
| **Pa11y / Pa11y CI** | Yes | Free | No | No |
| **Google Lighthouse** | Yes | Free | No | No |
| **WAVE** (WebAIM) | Partial | Free (single page) | No | No |
| **Siteimprove** | No | $15K-50K+/yr | Yes | Minimal |
| **Level Access** | No | Enterprise | Yes | Minimal |
| **Accessi.org** | No | Freemium | Yes | No |
| **GetWCAG** | No | Freemium | Yes | No |

### Video/Caption-Specific Tools

| Tool | Open Source | What It Does | Limitations |
|------|-----------|-------------|-------------|
| **3Play Media** | No | Captioning & AD services | Service, not an auditing tool |
| **Subly** | No | Caption file validation | No player/site auditing |
| **W3C WebVTT Validator** | Yes | WebVTT syntax checking | Format only, no quality/sync |
| **Able Player** | Yes | Accessible player implementation | Not a testing tool |

### Key Finding

**No tool combines:**
1. Site crawling with web accessibility auditing
2. Streaming-specific heuristics (video player detection, caption track verification, audio description checks)
3. EN 301 549 Clause 7 compliance mapping
4. Structured reporting with AI-powered recommendations

**This is a clear market gap.**

---

## 3. Product Definition

### Name
**EAA Stream Checker** (working title)

### One-liner
Paste a URL, get an EAA compliance report — with streaming-specific checks that no other tool provides.

### Target Users
- **Streaming service operators** needing to verify EAA compliance
- **Accessibility consultants** auditing media platforms
- **Broadcasters and content distributors** operating in the EU
- **Developers** building OTT/streaming platforms

### Core Features (MVP)

| Feature | Description |
|---------|-------------|
| **URL Input** | User provides a URL to a streaming site or page with video content |
| **Site Crawling** | Headless browser crawls the target page(s), rendering JavaScript-heavy players |
| **Web Accessibility Audit** | axe-core rules engine runs against rendered pages (WCAG 2.1 AA) |
| **Video Player Detection** | Heuristics identify `<video>`, `<audio>`, known player SDKs (hls.js, dash.js, Shaka, JW Player, Video.js, Bitmovin, etc.) |
| **Caption Track Detection** | Check for `<track kind="captions">`, WebVTT/SRT references in HLS manifests (.m3u8), DASH manifests (.mpd) |
| **Audio Description Detection** | Check for alternative audio tracks, `<track kind="descriptions">`, AD indicators in manifests |
| **Player Accessibility Checks** | Keyboard navigability of controls, ARIA labels on buttons, focus management, control visibility |
| **EN 301 549 Report** | Structured report mapped to specific EN 301 549 clauses (Clause 7 for video, Clause 9 for web) |
| **AI Interpretation Layer** | LLM analyzes ambiguous findings, generates plain-language recommendations, prioritizes fixes |

### EN 301 549 Clauses Covered

| Clause | What We Check | Automated? |
|--------|--------------|-----------|
| **7.1.1** Captioning playback | Caption track presence, player mode for displaying captions | Yes |
| **7.1.2** Caption synchronization | Timestamp validation in WebVTT/SRT files | Partial |
| **7.1.3** Preservation of captioning | Caption data presence in transport streams | Partial |
| **7.1.4** Caption characteristics | User controls for font, size, color, opacity, position | Yes |
| **7.2.1** Audio description playback | AD track presence, mechanism to select AD | Yes |
| **7.2.2** AD synchronization | Alignment check between AD and video | Manual flag |
| **7.3** User controls | Accessibility controls at same interaction level as primary controls | Yes |
| **9.x** Web content (WCAG 2.1 AA) | Full axe-core rule set | Yes |

---

## 4. Technical Architecture

### Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js / TypeScript | Primary language on Eyevinn OSC; rich ecosystem for web tooling |
| **Web Framework** | Fastify or Express | Lightweight API server |
| **Frontend** | React or plain HTML/CSS | Simple UI for URL input + report display |
| **Browser Automation** | Playwright | Headless Chromium for rendering JS-heavy streaming pages |
| **Accessibility Engine** | axe-core | Industry standard, open source, 90+ WCAG rules |
| **Manifest Parsing** | Custom (HLS/DASH) | Parse .m3u8 and .mpd for caption/AD tracks |
| **AI Layer** | OpenAI API or Claude API | Interpret findings, generate recommendations |
| **Report Storage** | PostgreSQL (via Eyevinn OSC) | Persist reports for history/comparison |
| **Deployment** | Docker → Eyevinn OSC | Containerized, deployed via OSC catalog or CLI |

### Architecture Diagram (text)

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (React)                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ URL Input │  │ Report View  │  │ History Dashboard  │ │
│  └────┬─────┘  └──────▲───────┘  └────────▲───────────┘ │
│       │               │                    │              │
└───────┼───────────────┼────────────────────┼──────────────┘
        │               │                    │
        ▼               │                    │
┌───────────────────────┼────────────────────┼──────────────┐
│                    API Server (Fastify)                    │
│                                                           │
│  ┌─────────────┐  ┌───────────┐  ┌─────────────────────┐│
│  │  Crawl      │  │  Report   │  │  AI Interpretation  ││
│  │  Orchestrator│  │  Generator│  │  Layer (LLM API)    ││
│  └──────┬──────┘  └─────▲─────┘  └──────────▲──────────┘│
│         │               │                    │            │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │              Analysis Pipeline                       │ │
│  │                                                      │ │
│  │  1. Playwright renders page                          │ │
│  │  2. axe-core runs WCAG audit                         │ │
│  │  3. Video player detector scans DOM                  │ │
│  │  4. Caption/AD track checker inspects                │ │
│  │     - <track> elements                               │ │
│  │     - HLS manifests (.m3u8)                          │ │
│  │     - DASH manifests (.mpd)                          │ │
│  │  5. Player accessibility checks                      │ │
│  │     - Keyboard navigation                            │ │
│  │     - ARIA labels                                    │ │
│  │     - Focus management                               │ │
│  │  6. Results mapped to EN 301 549 clauses             │ │
│  │  7. AI layer interprets + recommends                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                               │
│                    ┌──────▼──────┐                        │
│                    │ PostgreSQL  │                        │
│                    └─────────────┘                        │
└───────────────────────────────────────────────────────────┘

Deployed as Docker container on Eyevinn Open Source Cloud
```

---

## 5. Eyevinn OSC Deployment Strategy

### Why Eyevinn OSC?

1. **TypeScript/Node.js is first-class** — matches our stack perfectly
2. **Docker-based deployment** — standard containerization, no vendor lock-in
3. **Managed PostgreSQL** available for report storage
4. **Revenue sharing model** — if we open-source the tool, Eyevinn handles hosting and we earn from usage
5. **Media industry alignment** — Eyevinn's customer base (ITV, SVT, YLE) overlaps with our target market
6. **MCP integration** — AI agents could trigger compliance checks programmatically

### Deployment Steps

1. Package the application as a Docker container
2. Publish to Docker Hub
3. Register as a service on OSC catalog
4. Users can deploy with one click on osaas.io or via CLI:
   ```bash
   npm install -g @osaas/cli
   export OSC_ACCESS_TOKEN=<token>
   osc create eaa-stream-checker
   ```

### Relevant Eyevinn OSC Building Blocks

| Service | How We Use It |
|---------|--------------|
| **PostgreSQL** | Report storage and user history |
| **auto-subtitles** | Reference implementation for caption generation (Whisper-based) |
| **web-player** | Test fixture — verify our checks work against a known player |
| **MinIO** | Store generated report PDFs/artifacts |

---

## 6. Development Plan

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Basic URL → accessibility report pipeline

| Task | Details |
|------|---------|
| Project scaffolding | TypeScript, Fastify, Docker setup |
| Playwright crawler | Accept URL, render page in headless Chromium, handle SPAs |
| axe-core integration | Run accessibility audit on rendered page |
| Basic report generator | JSON output with WCAG violations mapped to EN 301 549 Clause 9 |
| Simple frontend | URL input form, raw report display |
| Docker packaging | Dockerfile for Eyevinn OSC deployment |

**Deliverable:** A working tool that crawls a URL and returns standard WCAG accessibility results, mapped to EN 301 549 web content clauses.

### Phase 2: Streaming-Specific Checks (Weeks 4-6)

**Goal:** Video player detection and caption/AD verification

| Task | Details |
|------|---------|
| Video player detector | DOM scanning for `<video>`, `<audio>`, known player SDKs (hls.js, dash.js, Shaka, Video.js, Bitmovin, JW Player) |
| Caption track checker | Inspect `<track>` elements, parse HLS manifests for `#EXT-X-MEDIA:TYPE=SUBTITLES`, parse DASH manifests for `<AdaptationSet>` with subtitle/caption roles |
| Audio description detector | Check for alternative audio tracks in manifests, `<track kind="descriptions">` |
| Player accessibility audit | Keyboard tab order through controls, ARIA labels on play/pause/volume/fullscreen, focus indicators, caption toggle at same level as primary controls |
| Caption customization check | Detect if player offers font size, color, background, position controls for captions |
| EN 301 549 Clause 7 mapping | Map all video-specific findings to Clause 7 sub-clauses |

**Deliverable:** The tool now detects video players, verifies caption/AD track availability, checks player keyboard accessibility, and maps findings to Clause 7.

### Phase 3: AI Layer & Reporting (Weeks 7-9)

**Goal:** Intelligent interpretation and professional reports

| Task | Details |
|------|---------|
| AI interpretation | Send findings to LLM for analysis of ambiguous results (e.g., "caption track found but language attribute missing — likely non-compliant with 7.1.1") |
| Plain-language recommendations | AI generates prioritized, actionable fix suggestions |
| Structured report output | HTML/PDF report with executive summary, per-clause compliance status (pass/fail/needs review), evidence screenshots, recommended actions |
| Report dashboard | History of scans, comparison over time, export options |
| PostgreSQL integration | Persist reports, enable scan history |

**Deliverable:** Full end-to-end product: URL input → crawl → audit → AI analysis → professional EAA compliance report.

### Phase 4: Polish & Launch (Weeks 10-12)

**Goal:** Production readiness

| Task | Details |
|------|---------|
| Multi-page crawling | Follow links within the same domain, configurable depth |
| Rate limiting & queuing | Handle concurrent scan requests, prevent abuse |
| Authentication | User accounts for scan history |
| OSC catalog listing | Publish to Eyevinn Open Source Cloud marketplace |
| Documentation | User guide, API docs, EN 301 549 clause reference |
| Landing page | Product website with demo |

---

## 7. Testing Strategy

### Unit Tests

| Area | What to Test |
|------|-------------|
| Manifest parsing | HLS (.m3u8) and DASH (.mpd) parsers correctly extract caption/AD track metadata |
| Player detection | Correctly identifies known player SDKs from DOM patterns |
| EN 301 549 mapping | Findings are mapped to correct clause numbers |
| Report generation | Output structure matches expected schema |

### Integration Tests

| Area | What to Test |
|------|-------------|
| Crawl pipeline | End-to-end: URL → Playwright render → axe-core audit → results |
| Video analysis | Crawl a page with a known video player → detect player, captions, AD |
| API endpoints | All REST endpoints return correct responses |
| Database | Reports are correctly stored and retrieved |

### Test Fixtures (critical for reliable testing)

Build a set of **reference streaming pages** with known characteristics:

| Fixture | Description | Expected Result |
|---------|-------------|----------------|
| `compliant-player.html` | Accessible video player with captions, AD, keyboard nav, ARIA labels | All Clause 7 checks pass |
| `no-captions.html` | Video player with no caption tracks | Fail 7.1.1 |
| `no-keyboard.html` | Video player with mouse-only controls | Fail 7.3, WCAG 2.1.1 |
| `no-aria.html` | Video player with unlabeled buttons | Fail WCAG 4.1.2 |
| `hls-with-subs.html` | HLS stream with subtitle tracks in manifest | Pass 7.1.1, detect subs |
| `dash-with-ad.html` | DASH stream with audio description track | Pass 7.2.1, detect AD |
| `caption-no-customize.html` | Captions present but no style controls | Fail 7.1.4 |

### Real-World Validation

Test against **known streaming services** to validate detection accuracy:

- Netflix, Disney+, SVT Play, BBC iPlayer, YouTube (known to have accessibility features)
- Smaller EU streaming services (likely to have gaps)
- Compare our findings against manual expert audits

### AI Layer Testing

| Test | Method |
|------|--------|
| Recommendation quality | Compare AI suggestions against expert-written recommendations for known scenarios |
| Consistency | Same input should produce similar (not necessarily identical) output |
| Hallucination prevention | Verify AI doesn't report findings not present in the data |
| Prompt regression | Track prompt versions, test against golden dataset |

### Performance Testing

| Metric | Target |
|--------|--------|
| Single page scan time | < 30 seconds |
| Full report generation (with AI) | < 60 seconds |
| Concurrent scans supported | 10+ simultaneous |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Streaming sites block headless browsers** | Can't crawl target pages | Use stealth Playwright settings, realistic user agents; document sites that block and provide manual upload alternative |
| **DRM-protected content blocks inspection** | Can't analyze player internals | Focus on publicly accessible UI elements; document DRM limitations in reports |
| **Automated checks miss 40-60% of issues** | False confidence in reports | Clearly label which checks are automated vs. need manual review; include "needs human verification" status |
| **EN 301 549 evolves** | Checks become outdated | Modular rule engine; version-track the standard; regular review cycle |
| **AI hallucinations in recommendations** | Incorrect advice | Ground AI responses in detected evidence; require citations to specific findings; allow user to flag bad recommendations |
| **Scope creep to mobile/TV apps** | Delays MVP | Stay focused on web-based streaming for v1; EN 301 549 Clause 11 (software) is a v2 concern |

---

## 9. Success Metrics

| Metric | Target (6 months post-launch) |
|--------|------------------------------|
| Registered users | 500+ |
| Scans performed | 5,000+ |
| Unique streaming domains scanned | 200+ |
| Detection accuracy (vs manual audit) | >85% for automated checks |
| Report generation success rate | >95% |
| User satisfaction (NPS) | >40 |

---

## 10. Open Questions

1. **Pricing model** — Free tier with limited scans + paid for full reports? Or fully open source with OSC hosting revenue?
2. **API access** — Should we offer a REST API for CI/CD integration from day one, or add it in v2?
3. **Scope of crawling** — Single page only in MVP, or allow multi-page site scans?
4. **AI provider** — OpenAI vs. Claude API vs. self-hosted model?
5. **Legal considerations** — Crawling third-party streaming sites may have ToS implications. Should we require user consent/ownership verification?
