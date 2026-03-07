import type { Page } from 'playwright-core';
import type { ManifestInfo } from './types.js';

export interface SignLanguageResult {
  hasSignLanguage: boolean;
  confidence: 'high' | 'medium' | 'low';
  indicators: SignLanguageIndicator[];
  recommendations: string[];
}

export interface SignLanguageIndicator {
  type: 'page_element' | 'manifest_track' | 'text_reference' | 'pip_overlay' | 'media_element';
  description: string;
  selector?: string;
}

export async function checkSignLanguage(
  page: Page,
  manifests: ManifestInfo[]
): Promise<SignLanguageResult> {
  const indicators: SignLanguageIndicator[] = [];

  // --- Check page for sign language UI elements and references ---
  const pageIndicators = await page.evaluate(() => {
    const results: Array<{
      type: 'page_element' | 'text_reference' | 'pip_overlay' | 'media_element';
      description: string;
      selector?: string;
    }> = [];

    // 1. Look for sign language toggle buttons, links, or selectors
    const signLanguageSelectors = [
      '[class*="sign-language"]',
      '[class*="sign_language"]',
      '[class*="signlanguage"]',
      '[class*="teckensprak"]',     // Swedish: teckenspråk
      '[class*="gebarden"]',        // Dutch/German: gebarentaal/Gebärdensprache
      '[class*="langue-des-signes"]', // French
      '[class*="lengua-de-signos"]',  // Spanish
      '[id*="sign-language"]',
      '[id*="sign_language"]',
      '[id*="signlanguage"]',
      '[data-sign-language]',
      '[aria-label*="sign language" i]',
      '[aria-label*="teckenspråk" i]',
      '[aria-label*="Gebärdensprache" i]',
      '[aria-label*="langue des signes" i]',
      '[title*="sign language" i]',
    ];

    for (const selector of signLanguageSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const tag = el.tagName.toLowerCase();
          const text = (el.textContent || '').trim().slice(0, 80);
          results.push({
            type: 'page_element',
            description: `Found element matching "${selector}": <${tag}> "${text}"`,
            selector,
          });
        }
      } catch {
        // Invalid selector — skip
      }
    }

    // 2. Look for picture-in-picture overlays (common sign language delivery)
    const pipSelectors = [
      '[class*="pip"]',
      '[class*="picture-in-picture"]',
      '[class*="overlay-video"]',
      '[class*="sign-video"]',
      '[class*="interpreter"]',
      'video + video', // Second video element overlaid on first
    ];

    for (const selector of pipSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          // Check if it contains or is a video element
          const hasVideo = el.tagName === 'VIDEO' || el.querySelector('video');
          if (hasVideo) {
            results.push({
              type: 'pip_overlay',
              description: `Found video overlay element matching "${selector}" — may be sign language interpreter`,
              selector,
            });
          }
        }
      } catch {
        // skip
      }
    }

    // 3. Check for multiple video elements (sign language often uses a second video)
    const videos = document.querySelectorAll('video');
    if (videos.length >= 2) {
      results.push({
        type: 'media_element',
        description: `Page has ${videos.length} video elements — the additional video(s) may be sign language interpretation`,
      });
    }

    // 4. Scan text content for sign language references
    const body = document.body;
    if (body) {
      const allText = body.innerText || '';
      const signLanguageTerms = [
        // English
        { pattern: /\bsign\s+language\b/i, lang: 'en' },
        { pattern: /\bsigned\s+version\b/i, lang: 'en' },
        { pattern: /\bsign\s+interpret/i, lang: 'en' },
        { pattern: /\bBSL\b/, lang: 'en' }, // British Sign Language
        { pattern: /\bASL\b/, lang: 'en' }, // American Sign Language
        { pattern: /\bISL\b/, lang: 'en' }, // International/Irish Sign Language
        // Swedish
        { pattern: /\bteckenspråk/i, lang: 'sv' },
        { pattern: /\btecken\s*tolk/i, lang: 'sv' },
        // German
        { pattern: /\bGebärdensprache\b/i, lang: 'de' },
        { pattern: /\bDGS\b/, lang: 'de' }, // Deutsche Gebärdensprache
        // French
        { pattern: /\blangue\s+des\s+signes\b/i, lang: 'fr' },
        { pattern: /\bLSF\b/, lang: 'fr' }, // Langue des Signes Française
        // Dutch
        { pattern: /\bgebarentaal\b/i, lang: 'nl' },
        { pattern: /\bNGT\b/, lang: 'nl' }, // Nederlandse Gebarentaal
        // Spanish
        { pattern: /\blengua\s+de\s+signos\b/i, lang: 'es' },
        { pattern: /\bLSE\b/, lang: 'es' }, // Lengua de Signos Española
        // Italian
        { pattern: /\blingua\s+dei\s+segni\b/i, lang: 'it' },
        { pattern: /\bLIS\b/, lang: 'it' }, // Lingua dei Segni Italiana
        // Portuguese
        { pattern: /\blíngua\s+de\s+sinais\b/i, lang: 'pt' },
      ];

      for (const term of signLanguageTerms) {
        if (term.pattern.test(allText)) {
          results.push({
            type: 'text_reference',
            description: `Page text contains sign language reference: "${term.pattern.source}" (${term.lang})`,
          });
        }
      }
    }

    // 5. Check for sign language related links
    const links = document.querySelectorAll('a[href]');
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href.toLowerCase();
      const text = (link.textContent || '').toLowerCase();
      if (
        href.includes('sign-language') || href.includes('sign_language') ||
        href.includes('teckensprak') || href.includes('gebarentaal') ||
        text.includes('sign language') || text.includes('teckenspråk')
      ) {
        results.push({
          type: 'page_element',
          description: `Found link referencing sign language: "${(link.textContent || '').trim().slice(0, 60)}"`,
          selector: `a[href*="${href.includes('sign') ? 'sign' : 'teck'}"]`,
        });
        break; // One link reference is enough
      }
    }

    return results;
  });

  for (const ind of pageIndicators) {
    indicators.push(ind);
  }

  // --- Check manifests for sign language tracks ---
  for (const manifest of manifests) {
    if (!manifest.rawContent) continue;
    const content = manifest.rawContent;

    if (manifest.type === 'hls') {
      // HLS: look for sign language in CHARACTERISTICS or NAME/LANGUAGE
      const signCharacteristics = [
        'public.accessibility.describes-music-and-sound', // Not sign, but check
        'sign', // Some non-standard implementations
      ];

      // Check for video renditions marked as sign language
      const mediaLines = content.split('\n').filter((l) => l.startsWith('#EXT-X-MEDIA:'));
      for (const line of mediaLines) {
        const nameMatch = line.match(/NAME="([^"]*)"/i);
        const name = nameMatch?.[1]?.toLowerCase() || '';
        const charMatch = line.match(/CHARACTERISTICS="([^"]*)"/i);
        const chars = charMatch?.[1]?.toLowerCase() || '';

        if (
          name.includes('sign') || name.includes('tecken') || name.includes('gebärden') ||
          name.includes('gebaar') || name.includes('langue des signes') ||
          chars.includes('sign')
        ) {
          indicators.push({
            type: 'manifest_track',
            description: `HLS manifest contains sign language track: "${nameMatch?.[1] || 'unknown'}"`,
          });
        }
      }
    } else if (manifest.type === 'dash') {
      // DASH: look for Role value="sign" or Accessibility with sign language
      if (/value\s*=\s*"sign"/i.test(content)) {
        indicators.push({
          type: 'manifest_track',
          description: 'DASH manifest contains AdaptationSet with Role value="sign" (sign language track)',
        });
      }

      // Check for sign language in labels
      const labelMatch = content.match(/label\s*=\s*"([^"]*sign[^"]*)"/i) ||
        content.match(/label\s*=\s*"([^"]*tecken[^"]*)"/i) ||
        content.match(/label\s*=\s*"([^"]*gebärden[^"]*)"/i);
      if (labelMatch) {
        indicators.push({
          type: 'manifest_track',
          description: `DASH manifest contains sign language label: "${labelMatch[1]}"`,
        });
      }
    }
  }

  // --- Determine result ---
  const hasSignLanguage = indicators.length > 0;

  let confidence: 'high' | 'medium' | 'low';
  const hasManifestTrack = indicators.some((i) => i.type === 'manifest_track');
  const hasPipOverlay = indicators.some((i) => i.type === 'pip_overlay');
  const hasPageElement = indicators.some((i) => i.type === 'page_element');
  const hasTextOnly = indicators.length > 0 && indicators.every((i) => i.type === 'text_reference');

  if (hasManifestTrack || (hasPipOverlay && hasPageElement)) {
    confidence = 'high';
  } else if (hasPageElement || hasPipOverlay) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // --- Recommendations ---
  const recommendations: string[] = [];

  if (!hasSignLanguage) {
    recommendations.push(
      'No sign language provisions detected. EN 301 549 Clause 7.1.6 recommends sign language interpretation for pre-recorded video content where feasible.'
    );
    recommendations.push(
      'Consider providing sign language interpretation for key content, especially live events and essential information.'
    );
    recommendations.push(
      'Sign language can be delivered via: embedded PiP overlay, separate video track, or link to a signed version.'
    );
  } else {
    if (hasTextOnly) {
      recommendations.push(
        'Page text references sign language but no active sign language video or controls were found. Verify that sign language content is actually available and accessible.'
      );
    }
    if (!hasManifestTrack && hasSignLanguage) {
      recommendations.push(
        'Sign language indicators found but no dedicated sign language track in streaming manifests. Consider adding a sign language video track to your HLS/DASH manifest for seamless player integration.'
      );
    }
  }

  return {
    hasSignLanguage,
    confidence: hasSignLanguage ? confidence : 'low',
    indicators,
    recommendations,
  };
}
