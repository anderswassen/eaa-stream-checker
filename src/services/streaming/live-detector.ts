import type { Page } from 'playwright-core';
import type { ManifestInfo } from './types.js';

export interface LiveDetectionResult {
  isLive: boolean;
  isVOD: boolean;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

export async function detectLiveOrVOD(
  page: Page,
  manifests: ManifestInfo[]
): Promise<LiveDetectionResult> {
  const indicators: string[] = [];
  let liveScore = 0;
  let vodScore = 0;
  let highConfidence = false;

  // --- Analyze manifests ---

  for (const manifest of manifests) {
    if (!manifest.rawContent) continue;
    const content = manifest.rawContent;

    if (manifest.type === 'hls') {
      // HLS: check playlist type
      const playlistTypeMatch = content.match(/#EXT-X-PLAYLIST-TYPE:\s*(\w+)/i);
      if (playlistTypeMatch) {
        const playlistType = playlistTypeMatch[1].toUpperCase();
        if (playlistType === 'VOD') {
          vodScore += 3;
          highConfidence = true;
          indicators.push('HLS manifest has #EXT-X-PLAYLIST-TYPE:VOD');
        } else if (playlistType === 'EVENT') {
          liveScore += 3;
          highConfidence = true;
          indicators.push('HLS manifest has #EXT-X-PLAYLIST-TYPE:EVENT (live event)');
        }
      }

      // HLS: check for ENDLIST tag
      if (/#EXT-X-ENDLIST/i.test(content)) {
        vodScore += 2;
        indicators.push('HLS manifest contains #EXT-X-ENDLIST tag');
      } else {
        // No ENDLIST could indicate live
        if (!playlistTypeMatch) {
          liveScore += 1;
          indicators.push('HLS manifest has no #EXT-X-ENDLIST tag (possible live)');
        }
      }
    } else if (manifest.type === 'dash') {
      // DASH: check MPD type attribute
      const typeMatch = content.match(/<MPD[^>]*\btype\s*=\s*"([^"]*)"/i);
      if (typeMatch) {
        const mpdType = typeMatch[1].toLowerCase();
        if (mpdType === 'static') {
          vodScore += 3;
          highConfidence = true;
          indicators.push('DASH MPD type="static" (VOD)');
        } else if (mpdType === 'dynamic') {
          liveScore += 3;
          highConfidence = true;
          indicators.push('DASH MPD type="dynamic" (live)');
        }
      }

      // DASH: check for minimumUpdatePeriod
      if (/minimumUpdatePeriod/i.test(content)) {
        liveScore += 2;
        indicators.push('DASH manifest has minimumUpdatePeriod (live indicator)');
      }
    }
  }

  // --- Check page for live indicators ---

  const pageIndicators = await page.evaluate(() => {
    const results: string[] = [];

    // Look for live badges / text indicators
    const livePatterns = ['LIVE', 'DIREKT', 'EN DIRECT', 'LIVE NOW', 'LIVESÄNDNING'];
    const allText = document.body?.innerText || '';

    for (const pattern of livePatterns) {
      // Check for exact word match (case-insensitive)
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(allText)) {
        results.push(`Page contains text "${pattern}"`);
      }
    }

    // Look for red dot / live indicator elements
    const liveDotSelectors = [
      '[class*="live-dot"]',
      '[class*="live-indicator"]',
      '[class*="live-badge"]',
      '[class*="is-live"]',
      '[data-live]',
      '.live-dot',
      '.live-indicator',
    ];

    for (const selector of liveDotSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        results.push(`Found live indicator element: ${selector}`);
      }
    }

    return results;
  });

  for (const indicator of pageIndicators) {
    liveScore += 1;
    indicators.push(indicator);
  }

  // --- Determine result ---

  const isLive = liveScore > vodScore;
  const isVOD = vodScore > liveScore;

  let confidence: 'high' | 'medium' | 'low';
  if (highConfidence) {
    confidence = 'high';
  } else if (indicators.length >= 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // If no indicators at all, default to unknown (neither live nor VOD with low confidence)
  if (indicators.length === 0) {
    return {
      isLive: false,
      isVOD: false,
      confidence: 'low',
      indicators: ['No live or VOD indicators found in manifests or page content'],
    };
  }

  return {
    isLive,
    isVOD,
    confidence,
    indicators,
  };
}
