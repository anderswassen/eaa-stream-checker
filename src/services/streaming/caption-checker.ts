import type { Page } from 'playwright';
import type {
  CaptionCheckResult,
  DomTrackInfo,
  ManifestInfo,
  PlayerApiTrackInfo,
} from './types.js';

async function checkDomTracks(page: Page): Promise<DomTrackInfo[]> {
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

    document
      .querySelectorAll('track[kind="captions"], track[kind="subtitles"]')
      .forEach((trackEl) => {
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

async function checkPlayerApiTracks(page: Page): Promise<PlayerApiTrackInfo[]> {
  return page.evaluate(() => {
    const results: Array<{
      label: string | null;
      language: string | null;
      kind: string | null;
    }> = [];

    // Check HTMLMediaElement textTracks API
    document.querySelectorAll('video, audio').forEach((el) => {
      const mediaEl = el as HTMLVideoElement | HTMLAudioElement;
      if (mediaEl.textTracks) {
        for (let i = 0; i < mediaEl.textTracks.length; i++) {
          const track = mediaEl.textTracks[i];
          if (track.kind === 'captions' || track.kind === 'subtitles') {
            results.push({
              label: track.label || null,
              language: track.language || null,
              kind: track.kind,
            });
          }
        }
      }
    });

    return results;
  });
}

function extractManifestCaptionTracks(manifests: ManifestInfo[]) {
  return manifests.flatMap((m) => m.subtitleTracks);
}

export async function checkCaptions(
  page: Page,
  manifests: ManifestInfo[]
): Promise<CaptionCheckResult> {
  const [domTracks, playerApiTracks] = await Promise.all([
    checkDomTracks(page),
    checkPlayerApiTracks(page),
  ]);

  const manifestTracks = extractManifestCaptionTracks(manifests);

  const allTracks = [
    ...domTracks,
    ...manifestTracks.map((t) => ({
      kind: 'subtitles' as const,
      srclang: t.language,
    })),
    ...playerApiTracks.map((t) => ({
      kind: t.kind,
      srclang: t.language,
    })),
  ];

  const hasCaptions =
    domTracks.length > 0 || manifestTracks.length > 0 || playerApiTracks.length > 0;

  const hasLanguageAttributes = allTracks.every(
    (t) => t.srclang !== null && t.srclang !== ''
  );

  return {
    domTracks,
    manifestTracks,
    playerApiTracks,
    hasCaptions,
    hasLanguageAttributes: hasCaptions ? hasLanguageAttributes : true,
  };
}
