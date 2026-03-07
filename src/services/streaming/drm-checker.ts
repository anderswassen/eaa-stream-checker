import type { Page } from 'playwright-core';
import type { ManifestInfo, CaptionCheckResult } from './types.js';

export interface DrmCheckResult {
  usesEME: boolean;
  drmSystems: string[];
  captionsOutsideDRM: boolean | null;
  hasAccessibleFallback: boolean | null;
}

export async function checkDRM(
  page: Page,
  manifests: ManifestInfo[],
  captions: CaptionCheckResult
): Promise<DrmCheckResult> {
  // Detect EME usage and DRM systems via page.evaluate()
  const drmInfo = await page.evaluate(() => {
    let usesEME = false;
    const systems: string[] = [];

    // Check if navigator.requestMediaKeySystemAccess exists
    if (typeof navigator.requestMediaKeySystemAccess === 'function') {
      // The API is available; check if any video element has mediaKeys set
      const videos = document.querySelectorAll('video');
      for (const video of videos) {
        if ((video as HTMLVideoElement).mediaKeys) {
          usesEME = true;
          break;
        }
      }
    }

    // Scan for DRM-related patterns in scripts
    const scripts = document.querySelectorAll('script');
    const scriptTexts: string[] = [];
    scripts.forEach((s) => {
      if (s.textContent) scriptTexts.push(s.textContent);
      if (s.src) scriptTexts.push(s.src);
    });

    const allScriptText = scriptTexts.join(' ');

    // Check for DRM system indicators
    const drmPatterns: Array<{ name: string; patterns: RegExp[] }> = [
      {
        name: 'widevine',
        patterns: [
          /widevine/i,
          /com\.widevine\.alpha/i,
        ],
      },
      {
        name: 'fairplay',
        patterns: [
          /fairplay/i,
          /com\.apple\.fps/i,
        ],
      },
      {
        name: 'playready',
        patterns: [
          /playready/i,
          /com\.microsoft\.playready/i,
        ],
      },
    ];

    for (const drm of drmPatterns) {
      for (const pattern of drm.patterns) {
        if (pattern.test(allScriptText)) {
          if (!systems.includes(drm.name)) {
            systems.push(drm.name);
          }
          break;
        }
      }
    }

    // Also check for generic EME patterns in script content
    if (!usesEME) {
      const emePatterns = [
        /requestMediaKeySystemAccess/,
        /MediaKeys/,
        /\bEME\b/,
        /encrypted\s*media/i,
      ];
      for (const pattern of emePatterns) {
        if (pattern.test(allScriptText)) {
          usesEME = true;
          break;
        }
      }
    }

    return { usesEME, systems };
  });

  // Also check DASH manifests for ContentProtection elements
  for (const manifest of manifests) {
    if (manifest.type === 'dash' && manifest.rawContent) {
      const content = manifest.rawContent;
      if (/ContentProtection/i.test(content)) {
        drmInfo.usesEME = true;
        if (/widevine/i.test(content) && !drmInfo.systems.includes('widevine')) {
          drmInfo.systems.push('widevine');
        }
        if (/playready/i.test(content) && !drmInfo.systems.includes('playready')) {
          drmInfo.systems.push('playready');
        }
        if (/fairplay/i.test(content) && !drmInfo.systems.includes('fairplay')) {
          drmInfo.systems.push('fairplay');
        }
      }
    }
  }

  // Check HLS manifests for #EXT-X-KEY or #EXT-X-SESSION-KEY
  for (const manifest of manifests) {
    if (manifest.type === 'hls' && manifest.rawContent) {
      const content = manifest.rawContent;
      if (/#EXT-X-KEY:|#EXT-X-SESSION-KEY:/i.test(content)) {
        drmInfo.usesEME = true;
        if (/METHOD=SAMPLE-AES/i.test(content) && !drmInfo.systems.includes('fairplay')) {
          drmInfo.systems.push('fairplay');
        }
      }
    }
  }

  // Determine if captions are outside the DRM envelope
  let captionsOutsideDRM: boolean | null = null;
  let hasAccessibleFallback: boolean | null = null;

  if (drmInfo.usesEME) {
    // Captions in DOM tracks are always outside DRM
    const hasDomCaptions = captions.domTracks.length > 0;

    // Captions in separate manifest subtitle tracks (sidecar) are typically outside DRM
    const hasManifestSubtitles = manifests.some((m) => m.subtitleTracks.length > 0);

    // Player API tracks loaded via textTracks are also outside DRM
    const hasPlayerApiCaptions = captions.playerApiTracks.length > 0;

    if (hasDomCaptions || hasManifestSubtitles || hasPlayerApiCaptions) {
      captionsOutsideDRM = true;
    } else if (captions.hasCaptions) {
      // Captions exist but we can't determine how they are delivered
      captionsOutsideDRM = null;
    } else {
      // No captions at all
      captionsOutsideDRM = false;
    }

    // Check for non-DRM fallback (no DRM-free alternative detected by default)
    hasAccessibleFallback = false;
  }

  return {
    usesEME: drmInfo.usesEME,
    drmSystems: drmInfo.systems,
    captionsOutsideDRM,
    hasAccessibleFallback,
  };
}
