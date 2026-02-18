import type { Page } from 'playwright';
import type { DetectedPlayer, MediaElementInfo, PlayerSDK } from './types.js';

interface SDKProbe {
  sdk: PlayerSDK;
  detect: string; // JS expression that returns truthy if SDK is present
  version: string; // JS expression that returns version string or null
  containerSelector: string; // CSS selector for the player container
}

const SDK_PROBES: SDKProbe[] = [
  {
    sdk: 'hls.js',
    detect: `typeof window.Hls !== 'undefined' || document.querySelector('script[src*="hls.js"], script[src*="hls.min.js"]') !== null`,
    version: `typeof window.Hls !== 'undefined' && window.Hls.version ? window.Hls.version : null`,
    containerSelector: 'video',
  },
  {
    sdk: 'dash.js',
    detect: `typeof window.dashjs !== 'undefined' || document.querySelector('script[src*="dash.all"], script[src*="dash.js"]') !== null`,
    version: `typeof window.dashjs !== 'undefined' && window.dashjs.Version ? window.dashjs.Version : null`,
    containerSelector: 'video',
  },
  {
    sdk: 'shaka',
    detect: `typeof window.shaka !== 'undefined' || document.querySelector('script[src*="shaka-player"]') !== null`,
    version: `typeof window.shaka !== 'undefined' && window.shaka.Player && window.shaka.Player.version ? window.shaka.Player.version : null`,
    containerSelector: 'video',
  },
  {
    sdk: 'videojs',
    detect: `typeof window.videojs !== 'undefined' || document.querySelector('.video-js') !== null`,
    version: `typeof window.videojs !== 'undefined' && window.videojs.VERSION ? window.videojs.VERSION : null`,
    containerSelector: '.video-js',
  },
  {
    sdk: 'jwplayer',
    detect: `typeof window.jwplayer !== 'undefined' || document.querySelector('.jwplayer') !== null`,
    version: `typeof window.jwplayer !== 'undefined' && window.jwplayer.version ? window.jwplayer.version : null`,
    containerSelector: '.jwplayer',
  },
  {
    sdk: 'bitmovin',
    detect: `typeof window.bitmovin !== 'undefined' || document.querySelector('[class*="bitmovin"], bitmovin-player, [id*="bitmovin"]') !== null`,
    version: `typeof window.bitmovin !== 'undefined' && window.bitmovin.player && window.bitmovin.player.Player && window.bitmovin.player.Player.version ? window.bitmovin.player.Player.version : null`,
    containerSelector: '[class*="bitmovin"], bitmovin-player, [id*="bitmovin"]',
  },
  {
    sdk: 'plyr',
    detect: `typeof window.Plyr !== 'undefined' || document.querySelector('.plyr') !== null`,
    version: `typeof window.Plyr !== 'undefined' && window.Plyr.version ? window.Plyr.version : null`,
    containerSelector: '.plyr',
  },
  {
    sdk: 'eyevinn',
    detect: `document.querySelector('eyevinn-video') !== null`,
    version: `null`,
    containerSelector: 'eyevinn-video',
  },
];

async function detectMediaElements(page: Page): Promise<MediaElementInfo[]> {
  return page.evaluate(() => {
    const elements: Array<{
      tagName: 'video' | 'audio';
      selector: string;
      src: string | null;
      hasTracks: boolean;
      trackCount: number;
    }> = [];

    const buildSelector = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      const parent = el.parentElement;
      if (!parent) return tag;
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === el.tagName
      );
      if (siblings.length === 1) return `${buildSelector(parent)} > ${tag}`;
      const index = siblings.indexOf(el) + 1;
      return `${buildSelector(parent)} > ${tag}:nth-of-type(${index})`;
    };

    for (const tag of ['video', 'audio'] as const) {
      document.querySelectorAll(tag).forEach((el) => {
        const mediaEl = el as HTMLVideoElement | HTMLAudioElement;
        const tracks = el.querySelectorAll('track');
        elements.push({
          tagName: tag,
          selector: buildSelector(el),
          src: mediaEl.src || mediaEl.querySelector('source')?.src || null,
          hasTracks: tracks.length > 0,
          trackCount: tracks.length,
        });
      });
    }

    return elements;
  });
}

export async function detectPlayers(page: Page): Promise<DetectedPlayer[]> {
  const players: DetectedPlayer[] = [];
  const mediaElements = await detectMediaElements(page);

  // Probe each known SDK
  for (const probe of SDK_PROBES) {
    const detected = await page.evaluate(probe.detect).catch(() => false);
    if (detected) {
      const version = await page
        .evaluate(probe.version)
        .catch(() => null) as string | null;

      // Find the container element
      const containerExists = await page
        .$(probe.containerSelector)
        .then((el) => el !== null)
        .catch(() => false);

      players.push({
        sdk: probe.sdk,
        version,
        containerSelector: containerExists ? probe.containerSelector : 'body',
        mediaElements,
      });
    }
  }

  // If no SDK detected but media elements exist, mark as native
  if (players.length === 0 && mediaElements.length > 0) {
    // Find the nearest ancestor that contains both the media element and controls
    const containerSelector = await page.evaluate((mediaSelector) => {
      const media = document.querySelector(mediaSelector);
      if (!media) return mediaSelector;

      let current: Element | null = media.parentElement;
      while (current && current !== document.body) {
        const hasControls = current.querySelector(
          'button, [role="button"], input[type="range"], [role="slider"]'
        );
        if (hasControls) {
          if (current.id) return `#${current.id}`;
          const tag = current.tagName.toLowerCase();
          const cls = Array.from(current.classList).slice(0, 2).join('.');
          return cls ? `${tag}.${cls}` : tag;
        }
        current = current.parentElement;
      }

      return mediaSelector;
    }, mediaElements[0].selector);

    players.push({
      sdk: 'native',
      version: null,
      containerSelector,
      mediaElements,
    });
  }

  return players;
}
