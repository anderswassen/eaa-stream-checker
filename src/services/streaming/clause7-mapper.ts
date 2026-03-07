import type {
  StreamingFinding,
  CaptionCheckResult,
  AudioDescriptionCheckResult,
  AudioTrackAnalysis,
  PlayerAccessibilityResult,
  ManifestInfo,
  ComplianceStatus,
  Severity,
} from './types.js';

interface Clause7Check {
  clauseId: string;
  clauseTitle: string;
  helpText: string;
  evaluate: (ctx: MappingContext) => { status: ComplianceStatus; description: string; evidence: string };
  severity: Severity;
}

interface MappingContext {
  captions: CaptionCheckResult;
  audioDescription: AudioDescriptionCheckResult;
  accessibility: PlayerAccessibilityResult | null;
  manifests: ManifestInfo[];
  playerDetected: boolean;
  audioTrackAnalysis?: AudioTrackAnalysis;
}

const CLAUSE_7_CHECKS: Clause7Check[] = [
  {
    clauseId: '7.1.1',
    clauseTitle: 'Captioning playback',
    helpText: 'Your video player must be able to display captions (subtitles) so viewers who are deaf or hard of hearing can follow the content.',
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

        // Collect caption language info
        const captionLangs = new Set<string>();
        for (const t of ctx.captions.domTracks) {
          if (t.srclang) captionLangs.add(t.srclang.toLowerCase());
        }
        for (const t of ctx.captions.manifestTracks) {
          if (t.language) captionLangs.add(t.language.toLowerCase());
        }
        for (const t of ctx.captions.playerApiTracks) {
          if (t.language) captionLangs.add(t.language.toLowerCase());
        }

        let languageNote = '';
        if (captionLangs.size > 0) {
          const langList = Array.from(captionLangs).sort().join(', ');
          languageNote = ` Caption tracks available in ${captionLangs.size} language(s): ${langList}.`;
        }

        // Check if there are audio tracks in languages without matching captions
        let coverageNote = '';
        if (ctx.audioTrackAnalysis && ctx.audioTrackAnalysis.languages.length > 0) {
          const audioLangs = ctx.audioTrackAnalysis.languages.filter((l) => l !== 'unknown');
          const missingCaptionLangs = audioLangs.filter((l) => !captionLangs.has(l));
          if (missingCaptionLangs.length > 0) {
            coverageNote = ` Note: Audio tracks exist in language(s) without matching caption tracks: ${missingCaptionLangs.join(', ')}.`;
          }
        }

        if (!ctx.captions.hasLanguageAttributes) {
          return {
            status: 'needs_review',
            description:
              'Caption tracks detected but some are missing language attributes. Players may not correctly identify the caption language.',
            evidence: `Found: ${sources.join(', ')}. One or more tracks missing srclang/language attribute.${languageNote}${coverageNote}`,
          };
        }

        return {
          status: 'pass',
          description: 'Caption/subtitle tracks detected with language attributes.',
          evidence: `Found: ${sources.join(', ')}.${languageNote}${coverageNote}`,
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
    helpText: 'Captions must appear in sync with the spoken audio so viewers can follow the dialogue at the right time.',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected || !ctx.captions.hasCaptions) {
        return {
          status: 'not_applicable',
          description: 'No captions detected to evaluate synchronization.',
          evidence: 'Caption playback check did not find caption tracks.',
        };
      }

      const quality = ctx.captions.quality;

      // If quality analysis was performed, use its results
      if (quality?.analyzed) {
        const issuesSummary = quality.issues.length > 0
          ? ` Issues: ${quality.issues.map((i) => i.description).join('; ')}`
          : '';

        if (quality.syncScore === 'good') {
          return {
            status: 'pass',
            description: `Caption file analyzed (${quality.format}, ${quality.cueCount} cues). Timestamps are sequential with no overlaps, gaps, or duration issues.`,
            evidence: `Analyzed: ${quality.captionUrl}. ${quality.cueCount} cues validated with no synchronization issues.`,
          };
        }

        if (quality.syncScore === 'acceptable') {
          return {
            status: 'needs_review',
            description: `Caption file analyzed (${quality.format}, ${quality.cueCount} cues). Minor synchronization issues detected that may need manual review.${issuesSummary}`,
            evidence: `Analyzed: ${quality.captionUrl}. ${quality.issues.length} issue(s) found.${issuesSummary}`,
          };
        }

        if (quality.syncScore === 'poor') {
          return {
            status: 'fail',
            description: `Caption file analyzed (${quality.format}, ${quality.cueCount} cues). Significant synchronization problems detected.${issuesSummary}`,
            evidence: `Analyzed: ${quality.captionUrl}. ${quality.issues.length} issue(s) found.${issuesSummary}`,
          };
        }
      }

      // Quality not analyzed (download failed or no downloadable URLs)
      const trackCount = ctx.captions.domTracks.length + ctx.captions.manifestTracks.length + ctx.captions.playerApiTracks.length;
      return {
        status: 'needs_review',
        description:
          'Caption tracks found but caption file could not be downloaded for automated synchronization analysis. Manual verification required.',
        evidence: `${trackCount} caption track(s) detected. Caption file download was not possible -- verify synchronization manually.`,
      };
    },
  },
  {
    clauseId: '7.1.3',
    clauseTitle: 'Preservation of captioning',
    helpText: 'Caption data must be preserved when video is transmitted or converted, so captions are not lost in delivery.',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }

      const quality = ctx.captions.quality;
      const qualityNote = quality?.analyzed
        ? ` Caption quality analysis: ${quality.syncScore} (${quality.format}, ${quality.cueCount} cues).`
        : '';

      const hasManifestCaptions = ctx.manifests.some(
        (m) => m.subtitleTracks.length > 0
      );
      if (hasManifestCaptions) {
        const manifestCount = ctx.manifests.filter((m) => m.subtitleTracks.length > 0).length;
        return {
          status: 'pass',
          description:
            'Caption data is present in the streaming manifest, indicating captions are preserved in the transport stream.',
          evidence: `Found subtitle tracks in ${manifestCount} manifest(s).${qualityNote}`,
        };
      }
      if (ctx.captions.domTracks.length > 0) {
        return {
          status: 'needs_review',
          description:
            'Captions are provided via DOM <track> elements (sidecar). Verify that captions are preserved if content is re-distributed.',
          evidence: `${ctx.captions.domTracks.length} DOM track(s) found, but no manifest-level caption tracks.${qualityNote}`,
        };
      }
      if (ctx.captions.hasCaptions) {
        return {
          status: 'needs_review',
          description:
            'Captions detected via player API but not in manifest. Verify preservation in transport.',
          evidence: `Caption tracks detected via player API only.${qualityNote}`,
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
    helpText: 'Users must be able to customize how captions look (font size, color, background, position) to suit their needs.',
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
    helpText: 'Your player must support audio description tracks that narrate visual content for viewers who are blind or have low vision.',
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

        // Add audio track analysis info
        let trackInfo = '';
        if (ctx.audioTrackAnalysis) {
          const ata = ctx.audioTrackAnalysis;
          trackInfo = ` ${ata.totalTracks} audio track(s) detected in ${ata.languages.length} language(s). AD available in ${ata.adLanguages.length} language(s): ${ata.adLanguages.join(', ') || 'none'}.`;
          if (ata.languagesMissingAD.length > 0) {
            trackInfo += ` Warning: Language(s) with main audio but no AD: ${ata.languagesMissingAD.join(', ')}.`;
          }
        }

        return {
          status: 'pass',
          description: 'Audio description capability detected.',
          evidence: `Found: ${sources.join(', ')}.${trackInfo}`,
        };
      }

      // Even when AD is not found, include audio track analysis in evidence
      let trackInfo = '';
      if (ctx.audioTrackAnalysis && ctx.audioTrackAnalysis.totalTracks > 0) {
        const ata = ctx.audioTrackAnalysis;
        trackInfo = ` ${ata.totalTracks} audio track(s) detected in ${ata.languages.length} language(s), but none identified as audio description.`;
      }

      return {
        status: 'fail',
        description:
          'No audio description tracks or controls detected. EN 301 549 requires mechanisms for audio description playback.',
        evidence:
          `No <track kind="descriptions"> in DOM, no AD audio tracks in HLS/DASH manifests, no AD selector in player UI.${trackInfo}`,
      };
    },
  },
  {
    clauseId: '7.2.2',
    clauseTitle: 'Audio description synchronization',
    helpText: 'Audio descriptions must be synchronized with the video so narrated visual details match what is happening on screen.',
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
    helpText: 'Audio description tracks must be preserved when video is transmitted or converted, so they are not lost in delivery.',
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
    helpText: 'Controls to turn captions and audio description on or off must be easy to find and accessible via keyboard, at the same level as play/pause.',
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
          `Caption control requires ${kb.tabStopsToCaptions} tab stops vs ${kb.tabStopsToPlay} for play \u2014 may not be at the same interaction level`
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
  {
    clauseId: '7.4.1',
    clauseTitle: 'Player controls: ARIA labels',
    helpText: 'All player controls (buttons, sliders) must have accessible names so screen readers can announce their purpose.',
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

      const aria = ctx.accessibility.ariaLabels;
      const total = aria.labeledButtons.length + aria.unlabeledButtons.length;

      if (total === 0) {
        return {
          status: 'needs_review',
          description: 'No interactive controls found in the player container.',
          evidence: 'No buttons or role="button" elements detected.',
        };
      }

      if (!aria.playerHasAccessibleName) {
        const unlabeledList = aria.unlabeledButtons.map((b) => b.selector).join(', ');
        return {
          status: 'needs_review',
          description: 'The player container itself lacks an accessible name (aria-label, aria-labelledby, or title). Individual control labeling may still be adequate.',
          evidence: `Player container missing accessible name. ${aria.labeledButtons.length}/${total} controls have accessible names.${aria.unlabeledButtons.length > 0 ? ` Unlabeled: ${unlabeledList}.` : ''}`,
        };
      }

      if (aria.unlabeledButtons.length === 0) {
        return {
          status: 'pass',
          description: 'All player controls have accessible names.',
          evidence: `${aria.labeledButtons.length}/${total} controls have accessible names (aria-label, text content, or title).`,
        };
      }

      const unlabeledList = aria.unlabeledButtons.map((b) => b.selector).join(', ');
      return {
        status: 'fail',
        description: `${aria.unlabeledButtons.length} player control(s) lack accessible names. Screen readers cannot announce the purpose of these controls.`,
        evidence: `${aria.labeledButtons.length}/${total} controls labeled. Unlabeled controls: ${unlabeledList}.`,
      };
    },
  },
  {
    clauseId: '7.4.2',
    clauseTitle: 'Player controls: Focus indicators',
    helpText: 'All interactive player controls must show a visible focus indicator when navigated via keyboard, so users know which control is active.',
    severity: 'major',
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

      const fi = ctx.accessibility.focusIndicators;
      const total = fi.controlsWithFocusIndicator.length + fi.controlsWithoutFocusIndicator.length;

      if (total === 0) {
        return {
          status: 'needs_review',
          description: 'No focusable controls found in the player to evaluate.',
          evidence: 'No focusable interactive elements detected.',
        };
      }

      if (fi.controlsWithoutFocusIndicator.length === 0) {
        return {
          status: 'pass',
          description: 'All interactive controls have visible focus indicators.',
          evidence: `${fi.controlsWithFocusIndicator.length}/${total} controls show a visible focus indicator (outline or box-shadow).`,
        };
      }

      const withoutPct = (fi.controlsWithoutFocusIndicator.length / total) * 100;
      const withoutList = fi.controlsWithoutFocusIndicator.join(', ');

      if (withoutPct > 50) {
        return {
          status: 'fail',
          description: `More than half of the player controls (${fi.controlsWithoutFocusIndicator.length}/${total}) lack visible focus indicators.`,
          evidence: `Controls without focus indicators: ${withoutList}.`,
        };
      }

      return {
        status: 'needs_review',
        description: `Some player controls (${fi.controlsWithoutFocusIndicator.length}/${total}) lack visible focus indicators.`,
        evidence: `Controls without focus indicators: ${withoutList}.`,
      };
    },
  },
  {
    clauseId: '7.4.3',
    clauseTitle: 'Player controls: Contrast',
    helpText: 'Player control icons and text must have sufficient color contrast against their background (at least 3:1 for UI components per WCAG 1.4.11).',
    severity: 'major',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }
      if (!ctx.accessibility || !ctx.accessibility.controlContrast) {
        return {
          status: 'needs_review',
          description: 'Contrast check not performed.',
          evidence: 'Player contrast checks were not run.',
        };
      }

      const cc = ctx.accessibility.controlContrast;

      if (cc.controlsChecked === 0) {
        return {
          status: 'needs_review',
          description: 'No controls found to evaluate contrast.',
          evidence: 'No visible interactive controls detected in the player.',
        };
      }

      if (cc.controlsBelowMinimum > 0) {
        const failList = cc.details
          .filter((d) => d.ratio < 3)
          .map((d) => `${d.selector} (${d.ratio}:1)`)
          .join(', ');
        return {
          status: 'fail',
          description: `${cc.controlsBelowMinimum} control(s) have contrast below the 3:1 minimum for UI components (WCAG 1.4.11). Lowest ratio: ${cc.lowestRatio}:1.`,
          evidence: `${cc.controlsChecked} controls checked. Below 3:1: ${failList}.`,
        };
      }

      if (cc.controlsBelowEnhanced > 0) {
        const reviewList = cc.details
          .filter((d) => d.ratio >= 3 && d.ratio < 4.5)
          .map((d) => `${d.selector} (${d.ratio}:1)`)
          .join(', ');
        return {
          status: 'needs_review',
          description: `All controls meet 3:1 minimum, but ${cc.controlsBelowEnhanced} control(s) are below 4.5:1 enhanced contrast. Lowest ratio: ${cc.lowestRatio}:1.`,
          evidence: `${cc.controlsChecked} controls checked. Between 3:1 and 4.5:1: ${reviewList}.`,
        };
      }

      return {
        status: 'pass',
        description: 'All player controls meet the minimum contrast ratio.',
        evidence: `${cc.controlsChecked} controls checked. Lowest contrast ratio: ${cc.lowestRatio}:1 (minimum 3:1 required for UI components).`,
      };
    },
  },
  {
    clauseId: '7.4.4',
    clauseTitle: 'Player controls: Touch target size',
    helpText: 'Player control buttons must be at least 24x24 pixels so users with motor impairments can activate them accurately (WCAG 2.5.8 level AA).',
    severity: 'minor',
    evaluate: (ctx) => {
      if (!ctx.playerDetected) {
        return {
          status: 'not_applicable',
          description: 'No video player detected.',
          evidence: 'No player found.',
        };
      }
      if (!ctx.accessibility || !ctx.accessibility.touchTargets) {
        return {
          status: 'needs_review',
          description: 'Touch target check not performed.',
          evidence: 'Player touch target checks were not run.',
        };
      }

      const tt = ctx.accessibility.touchTargets;

      if (tt.controlsChecked === 0) {
        return {
          status: 'needs_review',
          description: 'No controls found to evaluate touch target size.',
          evidence: 'No visible interactive controls detected in the player.',
        };
      }

      if (tt.allMeetMinimum) {
        return {
          status: 'pass',
          description: 'All player controls meet the minimum 24x24px touch target size.',
          evidence: `${tt.controlsChecked} controls checked. All meet the minimum 24x24px size (WCAG 2.5.8).`,
        };
      }

      const undersizedList = tt.undersizedControls
        .map((c) => `${c.selector} (${c.width}x${c.height}px)`)
        .join(', ');
      return {
        status: 'fail',
        description: `${tt.undersizedControls.length} control(s) are smaller than the minimum 24x24px touch target size (WCAG 2.5.8).`,
        evidence: `${tt.controlsChecked} controls checked. Undersized: ${undersizedList}.`,
      };
    },
  },
];

export function mapToClause7(
  captions: CaptionCheckResult,
  audioDescription: AudioDescriptionCheckResult,
  accessibility: PlayerAccessibilityResult | null,
  manifests: ManifestInfo[],
  playerDetected: boolean,
  audioTrackAnalysis?: AudioTrackAnalysis
): StreamingFinding[] {
  const ctx: MappingContext = {
    captions,
    audioDescription,
    accessibility,
    manifests,
    playerDetected,
    audioTrackAnalysis,
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
      helpText: check.helpText,
    };
  });
}
