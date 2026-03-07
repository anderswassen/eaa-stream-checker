import type { Page } from 'playwright-core';
import type {
  AudioDescriptionCheckResult,
  AudioTrackAnalysis,
  DomTrackInfo,
  ManifestInfo,
  ManifestAudioTrack,
} from './types.js';

async function checkDomDescriptionTracks(page: Page): Promise<DomTrackInfo[]> {
  return page.evaluate(() => {
    const tracks: Array<{
      kind: string;
      src: string | null;
      srclang: string | null;
      label: string | null;
      parentSelector: string;
    }> = [];

    const buildSelector = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      const parent = el.parentElement;
      if (!parent) return tag;
      return `${buildSelector(parent)} > ${tag}`;
    };

    document.querySelectorAll('track[kind="descriptions"]').forEach((trackEl) => {
      const track = trackEl as HTMLTrackElement;
      const parent = track.closest('video, audio');
      tracks.push({
        kind: track.kind,
        src: track.src || track.getAttribute('src'),
        srclang: track.srclang || track.getAttribute('srclang'),
        label: track.label || track.getAttribute('label'),
        parentSelector: parent ? buildSelector(parent) : 'unknown',
      });
    });

    return tracks;
  });
}

function extractManifestADTracks(manifests: ManifestInfo[]): ManifestAudioTrack[] {
  return manifests.flatMap((m) =>
    m.audioTracks.filter((t) => t.isAudioDescription)
  );
}

async function checkADSelector(page: Page): Promise<boolean> {
  // Heuristic: look for UI elements that reference audio description
  return page.evaluate(() => {
    const adPatterns = [
      'audio description',
      'audio-description',
      'audiodescription',
      'described video',
      'descriptive audio',
      'AD',
    ];

    // Check buttons, menu items, and labels
    const elements = document.querySelectorAll(
      'button, [role="menuitemradio"], [role="menuitem"], [role="option"], label, span'
    );

    for (const el of elements) {
      const text = (el.textContent || '').trim();
      const ariaLabel = el.getAttribute('aria-label') || '';
      const combined = `${text} ${ariaLabel}`.toLowerCase();
      for (const pattern of adPatterns) {
        if (combined.includes(pattern.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  });
}

export async function checkAudioDescription(
  page: Page,
  manifests: ManifestInfo[]
): Promise<AudioDescriptionCheckResult> {
  const [domDescriptionTracks, hasADSelector] = await Promise.all([
    checkDomDescriptionTracks(page),
    checkADSelector(page),
  ]);

  const manifestADTracks = extractManifestADTracks(manifests);

  const hasAudioDescription =
    domDescriptionTracks.length > 0 ||
    manifestADTracks.length > 0 ||
    hasADSelector;

  return {
    domDescriptionTracks,
    manifestADTracks,
    hasAudioDescription,
    hasADSelector,
  };
}

export function analyzeAudioTracks(
  manifests: ManifestInfo[],
  domDescriptionTracks: DomTrackInfo[]
): AudioTrackAnalysis {
  // Collect all audio tracks from manifests
  const allAudioTracks = manifests.flatMap((m) => m.audioTracks);

  // Normalize language codes to lowercase for comparison
  const normalizeLang = (lang: string | null): string =>
    (lang || 'unknown').toLowerCase().trim();

  // Collect unique languages for main (non-AD) audio tracks
  const mainLanguages = new Set<string>();
  const adLanguages = new Set<string>();
  let hasDefault = false;

  for (const track of allAudioTracks) {
    const lang = normalizeLang(track.language);
    if (track.isAudioDescription) {
      adLanguages.add(lang);
    } else {
      mainLanguages.add(lang);
    }
    if (track.isDefault) {
      hasDefault = true;
    }
  }

  // Also count DOM description tracks
  for (const domTrack of domDescriptionTracks) {
    const lang = normalizeLang(domTrack.srclang);
    adLanguages.add(lang);
  }

  // Find languages that have main audio but no corresponding AD
  const languagesMissingAD: string[] = [];
  for (const lang of mainLanguages) {
    if (!adLanguages.has(lang)) {
      languagesMissingAD.push(lang);
    }
  }

  const allLanguages = new Set([...mainLanguages, ...adLanguages]);

  return {
    totalTracks: allAudioTracks.length,
    languages: Array.from(allLanguages).sort(),
    hasAudioDescription: adLanguages.size > 0,
    adLanguages: Array.from(adLanguages).sort(),
    hasMultipleLanguages: allLanguages.size > 1,
    hasDefaultTrack: hasDefault,
    languagesMissingAD: languagesMissingAD.sort(),
  };
}
