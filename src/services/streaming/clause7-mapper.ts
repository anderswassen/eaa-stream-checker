import type {
  StreamingFinding,
  CaptionCheckResult,
  AudioDescriptionCheckResult,
  PlayerAccessibilityResult,
  ManifestInfo,
  ComplianceStatus,
  Severity,
} from './types.js';

interface Clause7Check {
  clauseId: string;
  clauseTitle: string;
  evaluate: (ctx: MappingContext) => { status: ComplianceStatus; description: string; evidence: string };
  severity: Severity;
}

interface MappingContext {
  captions: CaptionCheckResult;
  audioDescription: AudioDescriptionCheckResult;
  accessibility: PlayerAccessibilityResult | null;
  manifests: ManifestInfo[];
  playerDetected: boolean;
}

const CLAUSE_7_CHECKS: Clause7Check[] = [
  {
    clauseId: '7.1.1',
    clauseTitle: 'Captioning playback',
    severity: 'critical',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected on the page.',
          evidence: 'No <video> or known player SDK found.',
        };
      }
      if (ctx.captions.hasCaptions) {
        const sources: string[] = [];
        if (ctx.captions.domTracks.length > 0)
          sources.push(`${ctx.captions.domTracks.length} DOM <track> element(s)`);
        if (ctx.captions.manifestTracks.length > 0)
          sources.push(`${ctx.captions.manifestTracks.length} manifest subtitle track(s)`);
        if (ctx.captions.playerApiTracks.length > 0)
          sources.push(`${ctx.captions.playerApiTracks.length} player API text track(s)`);

        if (!ctx.captions.hasLanguageAttributes) {
          return {
            status: 'needs_review',
            description:
              'Caption tracks detected but some are missing language attributes. Players may not correctly identify the caption language.',
            evidence: `Found: ${sources.join(', ')}. One or more tracks missing srclang/language attribute.`,
          };
        }

        return {
          status: 'pass',
          description: 'Caption/subtitle tracks detected with language attributes.',
          evidence: `Found: ${sources.join(', ')}.`,
        };
      }
      return {
        status: 'fail',
        description:
          'No caption or subtitle tracks detected. EN 301 549 requires that ICT with video capabilities supports captioning playback.',
        evidence:
          'No <track kind="captions"|"subtitles"> in DOM, no subtitle tracks in HLS/DASH manifests, no text tracks via player API.',
      };
    },
  },
  {
    clauseId: '7.1.2',
    clauseTitle: 'Captioning synchronization',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected || !ctx.captions.hasCaptions) {
        return {
          status: 'not_applicable',
          description: 'No captions detected to evaluate synchronization.',
          evidence: 'Caption playback check did not find caption tracks.',
        };
      }
      // Synchronization requires fetching and parsing individual caption files —
      // this is flagged for manual review in the automated tool.
      return {
        status: 'needs_review',
        description:
          'Caption tracks found. Synchronization quality (timestamps are sequential, captions appear within acceptable delay) requires manual verification or caption file analysis.',
        evidence: `${ctx.captions.domTracks.length + ctx.captions.manifestTracks.length + ctx.captions.playerApiTracks.length} caption track(s) detected. Timestamp validation requires downloading and parsing caption files.`,
      };
    },
  },
  {
    clauseId: '7.1.3',
    clauseTitle: 'Preservation of captioning',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }
      const hasManifestCaptions = ctx.manifests.some(
        (m) => m.subtitleTracks.length > 0
      );
      if (hasManifestCaptions) {
        return {
          status: 'pass',
          description:
            'Caption data is present in the streaming manifest, indicating captions are preserved in the transport stream.',
          evidence: `Found subtitle tracks in ${ctx.manifests.filter((m) => m.subtitleTracks.length > 0).length} manifest(s).`,
        };
      }
      if (ctx.captions.domTracks.length > 0) {
        return {
          status: 'needs_review',
          description:
            'Captions are provided via DOM <track> elements (sidecar). Verify that captions are preserved if content is re-distributed.',
          evidence: `${ctx.captions.domTracks.length} DOM track(s) found, but no manifest-level caption tracks.`,
        };
      }
      if (ctx.captions.hasCaptions) {
        return {
          status: 'needs_review',
          description:
            'Captions detected via player API but not in manifest. Verify preservation in transport.',
          evidence: 'Caption tracks detected via player API only.',
        };
      }
      return {
        status: 'fail',
        description:
          'No caption data found in streaming manifests or DOM.',
        evidence: 'No subtitle tracks in HLS/DASH manifests, no <track> elements.',
      };
    },
  },
  {
    clauseId: '7.1.4',
    clauseTitle: 'Captioning characteristics',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected || !ctx.captions.hasCaptions) {
        return {
          status: 'not_applicable',
          description: 'No captions detected to evaluate customization.',
          evidence: 'No caption tracks found.',
        };
      }
      if (!ctx.accessibility) {
        return {
          status: 'needs_review',
          description: 'Player accessibility not evaluated. Cannot check caption customization.',
          evidence: 'Player accessibility checks were not run.',
        };
      }

      const cc = ctx.accessibility.captionCustomization;
      const options = cc.detectedOptions;

      if (options.length >= 3) {
        return {
          status: 'pass',
          description: `Player offers caption customization options: ${options.join(', ')}.`,
          evidence: `Detected ${options.length} customization option(s): ${options.join(', ')}.`,
        };
      }
      if (options.length > 0) {
        return {
          status: 'needs_review',
          description: `Some caption customization detected (${options.join(', ')}), but EN 301 549 expects controls for font, size, color, opacity, and position.`,
          evidence: `Only ${options.length} option(s) found: ${options.join(', ')}.`,
        };
      }
      return {
        status: 'fail',
        description:
          'No caption customization controls detected. EN 301 549 requires users to be able to modify caption appearance (font, size, color, opacity, position).',
        evidence: 'No font size, color, background, opacity, or position controls found in player UI.',
      };
    },
  },
  {
    clauseId: '7.2.1',
    clauseTitle: 'Audio description playback',
    severity: 'critical',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }
      if (ctx.audioDescription.hasAudioDescription) {
        const sources: string[] = [];
        if (ctx.audioDescription.domDescriptionTracks.length > 0)
          sources.push(`${ctx.audioDescription.domDescriptionTracks.length} DOM <track kind="descriptions"> element(s)`);
        if (ctx.audioDescription.manifestADTracks.length > 0)
          sources.push(`${ctx.audioDescription.manifestADTracks.length} manifest audio description track(s)`);
        if (ctx.audioDescription.hasADSelector)
          sources.push('AD selector UI element detected');

        return {
          status: 'pass',
          description: 'Audio description capability detected.',
          evidence: `Found: ${sources.join(', ')}.`,
        };
      }
      return {
        status: 'fail',
        description:
          'No audio description tracks or controls detected. EN 301 549 requires mechanisms for audio description playback.',
        evidence:
          'No <track kind="descriptions"> in DOM, no AD audio tracks in HLS/DASH manifests, no AD selector in player UI.',
      };
    },
  },
  {
    clauseId: '7.2.2',
    clauseTitle: 'Audio description synchronization',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected || !ctx.audioDescription.hasAudioDescription) {
        return {
          status: 'not_applicable',
          description: 'No audio description detected to evaluate synchronization.',
          evidence: 'AD check did not find audio description tracks.',
        };
      }
      return {
        status: 'needs_review',
        description:
          'Audio description tracks found. Synchronization with the video content requires manual verification.',
        evidence: 'AD track(s) detected. Sync quality must be verified by a human auditor.',
      };
    },
  },
  {
    clauseId: '7.2.3',
    clauseTitle: 'Preservation of audio description',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }
      const hasManifestAD = ctx.manifests.some((m) =>
        m.audioTracks.some((t) => t.isAudioDescription)
      );
      if (hasManifestAD) {
        return {
          status: 'pass',
          description: 'Audio description track is present in the streaming manifest.',
          evidence: `Found AD audio tracks in ${ctx.manifests.filter((m) => m.audioTracks.some((t) => t.isAudioDescription)).length} manifest(s).`,
        };
      }
      if (ctx.audioDescription.domDescriptionTracks.length > 0) {
        return {
          status: 'needs_review',
          description:
            'AD provided via DOM <track> element. Verify preservation in transport/redistribution.',
          evidence: `${ctx.audioDescription.domDescriptionTracks.length} DOM description track(s) found.`,
        };
      }
      return {
        status: 'not_applicable',
        description: 'No audio description tracks found in manifests to evaluate preservation.',
        evidence: 'No AD tracks in manifests or DOM.',
      };
    },
  },
  {
    clauseId: '7.3',
    clauseTitle: 'User controls for captions and audio description',
    severity: 'critical',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }
      if (!ctx.accessibility) {
        return {
          status: 'needs_review',
          description: 'Player accessibility not evaluated.',
          evidence: 'Player accessibility checks were not run.',
        };
      }

      const kb = ctx.accessibility.keyboardNavigation;
      const issues: string[] = [];

      if (!kb.canTabIntoPlayer) {
        return {
          status: 'fail',
          description:
            'Cannot tab into the player controls. Users relying on keyboard cannot access any controls including caption/AD toggles.',
          evidence: 'No focusable elements found within the player container.',
        };
      }

      if (kb.tabStopsToPlay === -1) {
        issues.push('Play/pause control not identified as keyboard-reachable');
      }

      // Check that caption/AD controls are at the same interaction level as play
      if (kb.tabStopsToCaptions === -1 && ctx.captions.hasCaptions) {
        issues.push('Caption toggle not keyboard-reachable despite captions being available');
      } else if (
        kb.tabStopsToPlay > 0 &&
        kb.tabStopsToCaptions > 0 &&
        Math.abs(kb.tabStopsToCaptions - kb.tabStopsToPlay) > 3
      ) {
        issues.push(
          `Caption control requires ${kb.tabStopsToCaptions} tab stops vs ${kb.tabStopsToPlay} for play — may not be at the same interaction level`
        );
      }

      if (!kb.controlsActivatableWithKeyboard) {
        issues.push('Controls may not be activatable with Enter/Space (no native <button> or role="button" found)');
      }

      if (issues.length === 0) {
        return {
          status: 'pass',
          description:
            'Player controls including caption/AD toggles are keyboard-accessible and at the same interaction level as primary controls.',
          evidence: `${kb.reachableControls.length} controls reachable via keyboard. Play at tab stop ${kb.tabStopsToPlay}, captions at ${kb.tabStopsToCaptions}.`,
        };
      }

      return {
        status: issues.length >= 2 ? 'fail' : 'needs_review',
        description: `Keyboard accessibility issues found: ${issues.join('; ')}.`,
        evidence: `Reachable: ${kb.reachableControls.join(', ') || 'none'}. Unreachable: ${kb.unreachableControls.join(', ') || 'none'}.`,
      };
    },
  },
];

export function mapToClause7(
  captions: CaptionCheckResult,
  audioDescription: AudioDescriptionCheckResult,
  accessibility: PlayerAccessibilityResult | null,
  manifests: ManifestInfo[],
  playerDetected: boolean
): StreamingFinding[] {
  const ctx: MappingContext = {
    captions,
    audioDescription,
    accessibility,
    manifests,
    playerDetected,
  };

  return CLAUSE_7_CHECKS.map((check) => {
    const result = check.evaluate(ctx);
    return {
      clauseId: check.clauseId,
      clauseTitle: check.clauseTitle,
      status: result.status,
      description: result.description,
      evidence: result.evidence,
      severity: check.severity,
    };
  });
}
