import type { Page } from 'playwright-core';

export interface IframeCheckResult {
  iframeCount: number;
  playerIframes: IframeInfo[];
  issues: IframeIssue[];
}

export interface IframeInfo {
  src: string;
  hasTitle: boolean;
  title?: string;
  hasSandbox: boolean;
  sandboxValue?: string;
  allowAttributes: string[];
  isPlayerEmbed: boolean;
}

export interface IframeIssue {
  type: 'missing_title' | 'keyboard_trap_risk' | 'missing_allow' | 'blocked_fullscreen';
  description: string;
  iframe: string;
}

const KNOWN_PLAYER_DOMAINS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
  'twitch.tv',
  'facebook.com/plugins/video',
  'player.vimeo.com',
  'players.brightcove.net',
  'fast.wistia.com',
  'embed.vidyard.com',
  'cdn.jwplayer.com',
  'player.eyevinn.technology',
];

function isPlayerEmbed(src: string): boolean {
  if (!src) return false;
  const lowerSrc = src.toLowerCase();
  return KNOWN_PLAYER_DOMAINS.some((domain) => lowerSrc.includes(domain));
}

export async function checkIframes(page: Page): Promise<IframeCheckResult> {
  const iframeData = await page.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    const results: Array<{
      src: string;
      hasTitle: boolean;
      title?: string;
      hasSandbox: boolean;
      sandboxValue?: string;
      allowAttributes: string[];
    }> = [];

    iframes.forEach((iframe) => {
      const src = iframe.src || iframe.getAttribute('src') || '';
      const title = iframe.title || iframe.getAttribute('title') || '';
      const sandbox = iframe.getAttribute('sandbox');
      const allow = iframe.getAttribute('allow') || '';

      results.push({
        src,
        hasTitle: title.length > 0,
        title: title || undefined,
        hasSandbox: sandbox !== null,
        sandboxValue: sandbox ?? undefined,
        allowAttributes: allow ? allow.split(';').map((a) => a.trim()).filter(Boolean) : [],
      });
    });

    return results;
  });

  const playerIframes: IframeInfo[] = [];
  const issues: IframeIssue[] = [];

  for (const data of iframeData) {
    const isPlayer = isPlayerEmbed(data.src);
    const info: IframeInfo = {
      ...data,
      isPlayerEmbed: isPlayer,
    };

    playerIframes.push(info);

    // Check for missing title attribute (accessibility requirement)
    if (!data.hasTitle) {
      issues.push({
        type: 'missing_title',
        description: `iframe is missing a title attribute. Screen readers cannot describe the purpose of this embedded content.`,
        iframe: data.src || '(no src)',
      });
    }

    // Check for player-specific issues
    if (isPlayer) {
      // Check if fullscreen is allowed
      const hasFullscreen = data.allowAttributes.some(
        (a) => a.includes('fullscreen')
      );
      const allowFullscreenAttr = true; // Legacy allowfullscreen handled by allow attribute

      if (!hasFullscreen) {
        issues.push({
          type: 'blocked_fullscreen',
          description: `Player iframe does not include "fullscreen" in the allow attribute. Users may not be able to view content in fullscreen mode.`,
          iframe: data.src,
        });
      }

      // Check for sandbox restrictions that could block accessibility
      if (data.hasSandbox && data.sandboxValue !== undefined) {
        const sandboxTokens = data.sandboxValue.split(/\s+/);
        if (!sandboxTokens.includes('allow-scripts')) {
          issues.push({
            type: 'keyboard_trap_risk',
            description: `Player iframe has sandbox attribute without "allow-scripts", which may prevent keyboard interaction and accessibility features.`,
            iframe: data.src,
          });
        }
        if (!sandboxTokens.includes('allow-same-origin')) {
          issues.push({
            type: 'keyboard_trap_risk',
            description: `Player iframe has sandbox attribute without "allow-same-origin", which may prevent accessibility API communication.`,
            iframe: data.src,
          });
        }
      }
    }
  }

  return {
    iframeCount: iframeData.length,
    playerIframes,
    issues,
  };
}
