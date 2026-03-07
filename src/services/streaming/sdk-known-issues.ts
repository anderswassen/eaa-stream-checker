import type { DetectedPlayer, PlayerSDK } from './types.js';

export interface KnownIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  affectedVersions?: string; // e.g., "< 8.0", "all", "7.x"
  fixedIn?: string;
  workaround?: string;
  reference?: string;
}

export interface SDKKnownIssuesResult {
  sdk: PlayerSDK;
  sdkDisplayName: string;
  version: string | null;
  knownIssues: KnownIssue[];
  recommendations: string[];
}

interface SDKProfile {
  displayName: string;
  issues: KnownIssue[];
}

const SDK_PROFILES: Partial<Record<PlayerSDK, SDKProfile>> = {
  'videojs': {
    displayName: 'Video.js',
    issues: [
      {
        id: 'videojs-caption-positioning',
        severity: 'major',
        title: 'Caption positioning lost in fullscreen',
        description: 'Captions may lose their custom position styling when entering fullscreen mode in Video.js versions prior to 8.x.',
        affectedVersions: '< 8.0',
        fixedIn: '8.0.0',
        workaround: 'Use CSS ::cue selectors to reinforce caption positioning in fullscreen.',
      },
      {
        id: 'videojs-settings-keyboard-trap',
        severity: 'critical',
        title: 'Settings menu keyboard trap',
        description: 'The caption settings submenu can trap keyboard focus, preventing users from returning to the main controls without using a mouse.',
        affectedVersions: '< 7.21',
        fixedIn: '7.21.0',
        workaround: 'Ensure Escape key handler is attached to all submenu elements.',
      },
      {
        id: 'videojs-aria-live',
        severity: 'major',
        title: 'Missing aria-live announcements for state changes',
        description: 'Play/pause state changes and volume adjustments are not announced to screen readers via aria-live regions.',
        affectedVersions: 'all',
        workaround: 'Add a custom aria-live region to announce player state changes.',
      },
      {
        id: 'videojs-focus-outline',
        severity: 'major',
        title: 'Default theme suppresses focus outlines',
        description: 'The default Video.js theme uses outline: none on controls, removing visible focus indicators for keyboard users.',
        affectedVersions: 'all',
        workaround: 'Override with .video-js button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }',
      },
    ],
  },
  'jwplayer': {
    displayName: 'JW Player',
    issues: [
      {
        id: 'jw-ad-toggle',
        severity: 'critical',
        title: 'Audio description toggle not keyboard-accessible',
        description: 'The audio description selection menu may not be reachable via keyboard Tab navigation in some JW Player configurations.',
        affectedVersions: '< 8.26',
        fixedIn: '8.26.0',
      },
      {
        id: 'jw-caption-contrast',
        severity: 'major',
        title: 'Default caption background contrast insufficient',
        description: 'Default caption styling uses semi-transparent black background that may not meet WCAG 1.4.3 contrast requirements against lighter video content.',
        affectedVersions: 'all',
        workaround: 'Configure caption background opacity to at least 80% via player setup options.',
      },
      {
        id: 'jw-mobile-touch-targets',
        severity: 'minor',
        title: 'Control bar buttons below 24px on mobile',
        description: 'On narrow viewports, some control bar buttons shrink below the WCAG 2.5.8 minimum 24x24px touch target size.',
        affectedVersions: 'all',
        workaround: 'Use CSS to enforce min-width/min-height of 24px on .jw-icon-* elements.',
      },
    ],
  },
  'hls.js': {
    displayName: 'hls.js',
    issues: [
      {
        id: 'hlsjs-no-player-ui',
        severity: 'minor',
        title: 'No built-in accessible player UI',
        description: 'hls.js is a playback engine only and provides no player controls. The hosting application must implement all accessible controls, ARIA labels, keyboard handling, and caption display UI.',
        affectedVersions: 'all',
      },
      {
        id: 'hlsjs-subtitle-default',
        severity: 'major',
        title: 'DEFAULT=YES subtitle tracks may not auto-enable',
        description: 'Subtitle tracks marked DEFAULT=YES in the HLS manifest may not automatically display unless the application explicitly enables them via the hls.js API.',
        affectedVersions: 'all',
        workaround: 'Listen to MANIFEST_PARSED event and call hls.subtitleTrack = defaultIndex to auto-enable default subtitles.',
      },
    ],
  },
  'dash.js': {
    displayName: 'dash.js',
    issues: [
      {
        id: 'dashjs-no-player-ui',
        severity: 'minor',
        title: 'No built-in accessible player UI',
        description: 'dash.js is a playback engine only. The hosting application must implement all accessible controls, including caption toggle, audio description selection, and keyboard navigation.',
        affectedVersions: 'all',
      },
      {
        id: 'dashjs-ttml-rendering',
        severity: 'major',
        title: 'TTML caption positioning may be ignored',
        description: 'TTML captions with region-based positioning may not render correctly. Captions may appear at default position (bottom-center) regardless of TTML region definitions.',
        affectedVersions: '< 4.7',
        fixedIn: '4.7.0',
      },
    ],
  },
  'shaka': {
    displayName: 'Shaka Player',
    issues: [
      {
        id: 'shaka-no-default-ui-a11y',
        severity: 'major',
        title: 'Default UI has limited screen reader support',
        description: 'Shaka Player\'s default UI controls may lack comprehensive ARIA attributes. The overflow menu and track selection dialogs may not announce changes to screen readers.',
        affectedVersions: '< 4.3',
        fixedIn: '4.3.0',
        workaround: 'Implement custom UI controls with proper ARIA attributes, or upgrade to 4.3+.',
      },
      {
        id: 'shaka-caption-customization',
        severity: 'minor',
        title: 'Limited caption customization in default UI',
        description: 'The default Shaka Player UI does not expose font size, color, or background controls for captions. Only track selection is available.',
        affectedVersions: 'all',
        workaround: 'Use the TextDisplayer API to implement custom caption rendering with user controls.',
      },
    ],
  },
  'bitmovin': {
    displayName: 'Bitmovin Player',
    issues: [
      {
        id: 'bitmovin-focus-management',
        severity: 'major',
        title: 'Focus management issues in settings panel',
        description: 'When opening the settings/quality panel, keyboard focus may not move into the panel automatically, requiring users to Tab through unrelated elements.',
        affectedVersions: '< 8.130',
        fixedIn: '8.130.0',
      },
      {
        id: 'bitmovin-thumbnail-alt',
        severity: 'minor',
        title: 'Seek bar thumbnails lack alt text',
        description: 'Preview thumbnails shown during seek bar hover/scrub do not have alternative text, making them invisible to screen readers.',
        affectedVersions: 'all',
      },
    ],
  },
  'plyr': {
    displayName: 'Plyr',
    issues: [
      {
        id: 'plyr-a11y-good',
        severity: 'minor',
        title: 'Generally good accessibility baseline',
        description: 'Plyr has strong built-in accessibility support including ARIA labels, keyboard navigation, and focus indicators. However, caption customization options are limited to what the browser natively provides.',
        affectedVersions: 'all',
      },
      {
        id: 'plyr-pip-keyboard',
        severity: 'major',
        title: 'Picture-in-Picture mode not keyboard-activatable',
        description: 'The PiP button may not be reachable via keyboard in some configurations where custom controls override default behavior.',
        affectedVersions: '< 3.7',
        fixedIn: '3.7.0',
      },
    ],
  },
  'eyevinn': {
    displayName: 'Eyevinn Web Player',
    issues: [
      {
        id: 'eyevinn-verify-a11y',
        severity: 'minor',
        title: 'Verify accessibility configuration',
        description: 'Eyevinn Web Player supports accessibility features. Verify that ARIA labels, keyboard navigation, and caption controls are properly configured for your deployment.',
        affectedVersions: 'all',
      },
    ],
  },
  'native': {
    displayName: 'Native HTML5 Video',
    issues: [
      {
        id: 'native-controls-limited',
        severity: 'major',
        title: 'Browser-dependent accessibility of native controls',
        description: 'Native HTML5 video controls vary significantly in accessibility across browsers. Some browsers lack caption settings, audio description support, or proper keyboard handling in the native control bar.',
        affectedVersions: 'all',
        workaround: 'Consider using a player library with consistent cross-browser accessibility, or implement custom controls with full ARIA support.',
      },
      {
        id: 'native-caption-customization',
        severity: 'major',
        title: 'Caption customization only via browser/OS settings',
        description: 'Native video controls do not expose in-player caption customization (font size, color, background). Users must rely on browser or OS-level caption settings, which many users are unaware of.',
        affectedVersions: 'all',
      },
    ],
  },
};

function isVersionAffected(playerVersion: string | null, affectedVersions: string | undefined): boolean {
  if (!affectedVersions || affectedVersions === 'all') return true;
  if (!playerVersion) return true; // Unknown version — assume affected

  const ver = playerVersion.replace(/^v/, '');
  const major = parseInt(ver.split('.')[0], 10);
  const minor = parseInt(ver.split('.')[1] || '0', 10);

  // Parse "< X.Y" patterns
  const ltMatch = affectedVersions.match(/^<\s*(\d+)(?:\.(\d+))?/);
  if (ltMatch) {
    const targetMajor = parseInt(ltMatch[1], 10);
    const targetMinor = parseInt(ltMatch[2] || '0', 10);
    if (isNaN(major)) return true;
    if (major < targetMajor) return true;
    if (major === targetMajor && minor < targetMinor) return true;
    return false;
  }

  // Parse "X.x" patterns (any minor of major X)
  const majorMatch = affectedVersions.match(/^(\d+)\.x$/);
  if (majorMatch) {
    return major === parseInt(majorMatch[1], 10);
  }

  return true; // Unknown pattern — assume affected
}

export function lookupKnownIssues(players: DetectedPlayer[]): SDKKnownIssuesResult[] {
  const results: SDKKnownIssuesResult[] = [];

  for (const player of players) {
    const profile = SDK_PROFILES[player.sdk];
    if (!profile) {
      results.push({
        sdk: player.sdk,
        sdkDisplayName: player.sdk === 'unknown' ? 'Unknown Player' : player.sdk,
        version: player.version,
        knownIssues: [],
        recommendations: ['No known issue database available for this player SDK. Manual accessibility testing recommended.'],
      });
      continue;
    }

    const applicableIssues = profile.issues.filter((issue) =>
      isVersionAffected(player.version, issue.affectedVersions)
    );

    const recommendations: string[] = [];

    // Check for upgrade recommendation
    const fixableByUpgrade = applicableIssues.filter((i) => i.fixedIn);
    if (fixableByUpgrade.length > 0) {
      const latestFix = fixableByUpgrade.reduce((latest, issue) => {
        if (!latest.fixedIn) return issue;
        if (!issue.fixedIn) return latest;
        const lMajor = parseInt(latest.fixedIn.split('.')[0], 10);
        const iMajor = parseInt(issue.fixedIn.split('.')[0], 10);
        return iMajor > lMajor ? issue : latest;
      });
      recommendations.push(
        `Upgrade ${profile.displayName} to ${latestFix.fixedIn} or later to resolve ${fixableByUpgrade.length} known issue(s).`
      );
    }

    if (applicableIssues.some((i) => i.workaround)) {
      recommendations.push(
        'Workarounds are available for some issues — see individual findings for details.'
      );
    }

    results.push({
      sdk: player.sdk,
      sdkDisplayName: profile.displayName,
      version: player.version,
      knownIssues: applicableIssues,
      recommendations,
    });
  }

  return results;
}
