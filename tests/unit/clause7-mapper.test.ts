import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapToClause7 } from '../../src/services/streaming/clause7-mapper.js';
import type {
  CaptionCheckResult,
  AudioDescriptionCheckResult,
  PlayerAccessibilityResult,
  ManifestInfo,
  AudioTrackAnalysis,
} from '../../src/services/streaming/types.js';
import type { DrmCheckResult } from '../../src/services/streaming/drm-checker.js';
import type { LiveDetectionResult } from '../../src/services/streaming/live-detector.js';
import type { IframeCheckResult } from '../../src/services/streaming/iframe-checker.js';
import type { BitrateCheckResult } from '../../src/services/streaming/bitrate-checker.js';
import type { SignLanguageResult } from '../../src/services/streaming/sign-language-checker.js';
import type { SDKKnownIssuesResult } from '../../src/services/streaming/sdk-known-issues.js';

function makeCaptions(overrides: Partial<CaptionCheckResult> = {}): CaptionCheckResult {
  return {
    domTracks: [],
    manifestTracks: [],
    playerApiTracks: [],
    hasCaptions: false,
    hasLanguageAttributes: true,
    ...overrides,
  };
}

function makeAD(overrides: Partial<AudioDescriptionCheckResult> = {}): AudioDescriptionCheckResult {
  return {
    domDescriptionTracks: [],
    manifestADTracks: [],
    hasAudioDescription: false,
    hasADSelector: false,
    ...overrides,
  };
}

function makeAccessibility(overrides: Partial<PlayerAccessibilityResult> = {}): PlayerAccessibilityResult {
  return {
    keyboardNavigation: {
      canTabIntoPlayer: true,
      reachableControls: ['play/pause', 'captions toggle'],
      unreachableControls: [],
      tabStopsToPlay: 1,
      tabStopsToCaptions: 2,
      tabStopsToAD: -1,
      controlsActivatableWithKeyboard: true,
    },
    ariaLabels: {
      labeledButtons: [],
      unlabeledButtons: [],
      playerHasRole: true,
      playerHasAccessibleName: true,
    },
    focusIndicators: {
      controlsWithFocusIndicator: [],
      controlsWithoutFocusIndicator: [],
    },
    captionCustomization: {
      hasFontSizeControl: false,
      hasColorControl: false,
      hasBackgroundControl: false,
      hasOpacityControl: false,
      hasPositionControl: false,
      detectedOptions: [],
    },
    ...overrides,
  };
}

const ALL_CLAUSE_IDS = [
  '7.1.1', '7.1.2', '7.1.3', '7.1.4', '7.1.5', '7.1.6',
  '7.2.1', '7.2.2', '7.2.3',
  '7.3',
  '7.4.1', '7.4.2', '7.4.3', '7.4.4',
  '7.5.1', '7.5.2', '7.5.3',
  '7.6.1',
];

// ---- Clause 7.1.x: Captions ----

describe('Clause 7 mapper', () => {
  it('returns not_applicable or needs_review for all clauses when no player detected', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      null,
      [],
      false
    );

    // Clauses that depend on optional checks (DRM, iframe, bitrate) may return
    // needs_review when those checks were not provided, rather than not_applicable.
    const allowedStatuses = ['not_applicable', 'needs_review'];
    for (const f of findings) {
      assert.ok(
        allowedStatuses.includes(f.status),
        `${f.clauseId} should be not_applicable or needs_review, got ${f.status}`
      );
    }

    // Core clauses (7.1.x, 7.2.x, 7.3) should be not_applicable when no player
    const coreClauseIds = ['7.1.1', '7.1.2', '7.1.3', '7.1.4', '7.2.1', '7.2.2', '7.2.3', '7.3',
      '7.4.1', '7.4.2', '7.4.3', '7.4.4'];
    for (const f of findings.filter((f) => coreClauseIds.includes(f.clauseId))) {
      assert.equal(f.status, 'not_applicable', `${f.clauseId} should be not_applicable when no player`);
    }
  });

  it('reports 7.1.1 as pass when captions exist with language attributes', () => {
    const findings = mapToClause7(
      makeCaptions({
        hasCaptions: true,
        domTracks: [
          { kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' },
        ],
        hasLanguageAttributes: true,
      }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f711 = findings.find((f) => f.clauseId === '7.1.1');
    assert.ok(f711);
    assert.equal(f711.status, 'pass');
  });

  it('reports 7.1.1 as fail when no captions exist', () => {
    const findings = mapToClause7(
      makeCaptions({ hasCaptions: false }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f711 = findings.find((f) => f.clauseId === '7.1.1');
    assert.ok(f711);
    assert.equal(f711.status, 'fail');
    assert.equal(f711.severity, 'critical');
  });

  it('reports 7.1.1 as needs_review when captions exist but missing language', () => {
    const findings = mapToClause7(
      makeCaptions({
        hasCaptions: true,
        domTracks: [
          { kind: 'captions', src: 'c.vtt', srclang: null, label: null, parentSelector: 'video' },
        ],
        hasLanguageAttributes: false,
      }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f711 = findings.find((f) => f.clauseId === '7.1.1');
    assert.ok(f711);
    assert.equal(f711.status, 'needs_review');
  });

  it('reports 7.1.2 as needs_review when captions exist but no quality analysis', () => {
    const findings = mapToClause7(
      makeCaptions({
        hasCaptions: true,
        domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }],
      }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f712 = findings.find((f) => f.clauseId === '7.1.2');
    assert.ok(f712);
    assert.equal(f712.status, 'needs_review');
  });

  it('reports 7.1.2 as pass when caption quality is good', () => {
    const findings = mapToClause7(
      makeCaptions({
        hasCaptions: true,
        domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }],
        quality: {
          analyzed: true,
          captionUrl: 'c.vtt',
          format: 'webvtt',
          cueCount: 100,
          issues: [],
          syncScore: 'good',
        },
      }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f712 = findings.find((f) => f.clauseId === '7.1.2');
    assert.ok(f712);
    assert.equal(f712.status, 'pass');
  });

  it('reports 7.1.2 as fail when caption quality is poor', () => {
    const findings = mapToClause7(
      makeCaptions({
        hasCaptions: true,
        domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }],
        quality: {
          analyzed: true,
          captionUrl: 'c.vtt',
          format: 'webvtt',
          cueCount: 50,
          issues: [
            { type: 'non_sequential', description: 'Non-sequential timestamps' },
            { type: 'overlapping', description: 'Overlapping cues' },
            { type: 'excessive_gap', description: 'Excessive gap' },
          ],
          syncScore: 'poor',
        },
      }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f712 = findings.find((f) => f.clauseId === '7.1.2');
    assert.ok(f712);
    assert.equal(f712.status, 'fail');
  });

  it('reports 7.1.4 as fail when no caption customization', () => {
    const findings = mapToClause7(
      makeCaptions({ hasCaptions: true, domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }] }),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const f714 = findings.find((f) => f.clauseId === '7.1.4');
    assert.ok(f714);
    assert.equal(f714.status, 'fail');
  });

  it('reports 7.1.4 as pass when 3+ customization options', () => {
    const findings = mapToClause7(
      makeCaptions({ hasCaptions: true, domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }] }),
      makeAD(),
      makeAccessibility({
        captionCustomization: {
          hasFontSizeControl: true,
          hasColorControl: true,
          hasBackgroundControl: true,
          hasOpacityControl: false,
          hasPositionControl: false,
          detectedOptions: ['font size', 'font color', 'background color'],
        },
      }),
      [],
      true
    );

    const f714 = findings.find((f) => f.clauseId === '7.1.4');
    assert.ok(f714);
    assert.equal(f714.status, 'pass');
  });
});

// ---- Clause 7.2.x: Audio Description ----

describe('Clause 7.2 — Audio Description', () => {
  it('reports 7.2.1 as pass when AD tracks exist', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD({
        hasAudioDescription: true,
        manifestADTracks: [
          { language: 'en', name: 'AD', uri: null, isDefault: false, autoSelect: false, isAudioDescription: true, characteristics: null },
        ],
      }),
      makeAccessibility(),
      [],
      true
    );

    const f721 = findings.find((f) => f.clauseId === '7.2.1');
    assert.ok(f721);
    assert.equal(f721.status, 'pass');
  });

  it('reports 7.2.1 as fail when no AD tracks', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD({ hasAudioDescription: false }),
      makeAccessibility(),
      [],
      true
    );

    const f721 = findings.find((f) => f.clauseId === '7.2.1');
    assert.ok(f721);
    assert.equal(f721.status, 'fail');
    assert.equal(f721.severity, 'critical');
  });

  it('includes audio track analysis info when AD passes', () => {
    const audioTrackAnalysis: AudioTrackAnalysis = {
      totalTracks: 3,
      languages: ['en', 'sv'],
      hasAudioDescription: true,
      adLanguages: ['en'],
      hasMultipleLanguages: true,
      hasDefaultTrack: true,
      languagesMissingAD: ['sv'],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD({
        hasAudioDescription: true,
        manifestADTracks: [
          { language: 'en', name: 'AD', uri: null, isDefault: false, autoSelect: false, isAudioDescription: true, characteristics: null },
        ],
      }),
      makeAccessibility(),
      [],
      true,
      audioTrackAnalysis
    );

    const f721 = findings.find((f) => f.clauseId === '7.2.1');
    assert.ok(f721);
    assert.equal(f721.status, 'pass');
    assert.ok(f721.evidence.includes('sv'), 'Should mention missing AD language');
  });
});

// ---- Clause 7.3: User controls ----

describe('Clause 7.3 — User controls', () => {
  it('reports 7.3 as fail when player is not keyboard-accessible', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        keyboardNavigation: {
          canTabIntoPlayer: false,
          reachableControls: [],
          unreachableControls: ['play', 'pause'],
          tabStopsToPlay: -1,
          tabStopsToCaptions: -1,
          tabStopsToAD: -1,
          controlsActivatableWithKeyboard: false,
        },
      }),
      [],
      true
    );

    const f73 = findings.find((f) => f.clauseId === '7.3');
    assert.ok(f73);
    assert.equal(f73.status, 'fail');
  });

  it('reports 7.3 as pass when controls are keyboard-accessible', () => {
    const findings = mapToClause7(
      makeCaptions({ hasCaptions: true, domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }] }),
      makeAD(),
      makeAccessibility({
        keyboardNavigation: {
          canTabIntoPlayer: true,
          reachableControls: ['play/pause', 'captions toggle', 'volume'],
          unreachableControls: [],
          tabStopsToPlay: 1,
          tabStopsToCaptions: 2,
          tabStopsToAD: -1,
          controlsActivatableWithKeyboard: true,
        },
      }),
      [],
      true
    );

    const f73 = findings.find((f) => f.clauseId === '7.3');
    assert.ok(f73);
    assert.equal(f73.status, 'pass');
  });
});

// ---- Clause 7.4.x: Player controls accessibility ----

describe('Clause 7.4 — Player controls', () => {
  it('reports 7.4.1 as pass when all controls have ARIA labels', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        ariaLabels: {
          labeledButtons: [
            { selector: 'button.play', accessibleName: 'Play', role: 'button' },
            { selector: 'button.mute', accessibleName: 'Mute', role: 'button' },
          ],
          unlabeledButtons: [],
          playerHasRole: true,
          playerHasAccessibleName: true,
        },
      }),
      [],
      true
    );

    const f741 = findings.find((f) => f.clauseId === '7.4.1');
    assert.ok(f741);
    assert.equal(f741.status, 'pass');
  });

  it('reports 7.4.1 as fail when controls lack ARIA labels', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        ariaLabels: {
          labeledButtons: [
            { selector: 'button.play', accessibleName: 'Play', role: 'button' },
          ],
          unlabeledButtons: [
            { selector: 'button.settings', accessibleName: null, role: 'button' },
          ],
          playerHasRole: true,
          playerHasAccessibleName: true,
        },
      }),
      [],
      true
    );

    const f741 = findings.find((f) => f.clauseId === '7.4.1');
    assert.ok(f741);
    assert.equal(f741.status, 'fail');
  });

  it('reports 7.4.2 as pass when all controls have focus indicators', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        focusIndicators: {
          controlsWithFocusIndicator: ['button.play', 'button.mute'],
          controlsWithoutFocusIndicator: [],
        },
      }),
      [],
      true
    );

    const f742 = findings.find((f) => f.clauseId === '7.4.2');
    assert.ok(f742);
    assert.equal(f742.status, 'pass');
  });

  it('reports 7.4.2 as fail when most controls lack focus indicators', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        focusIndicators: {
          controlsWithFocusIndicator: [],
          controlsWithoutFocusIndicator: ['button.play', 'button.mute', 'button.cc'],
        },
      }),
      [],
      true
    );

    const f742 = findings.find((f) => f.clauseId === '7.4.2');
    assert.ok(f742);
    assert.equal(f742.status, 'fail');
  });

  it('reports 7.4.3 as pass when contrast is sufficient', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        controlContrast: {
          controlsChecked: 3,
          controlsBelowMinimum: 0,
          controlsBelowEnhanced: 0,
          lowestRatio: 7.2,
          details: [],
        },
      }),
      [],
      true
    );

    const f743 = findings.find((f) => f.clauseId === '7.4.3');
    assert.ok(f743);
    assert.equal(f743.status, 'pass');
  });

  it('reports 7.4.3 as fail when contrast is below minimum', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        controlContrast: {
          controlsChecked: 2,
          controlsBelowMinimum: 1,
          controlsBelowEnhanced: 1,
          lowestRatio: 2.1,
          details: [
            { selector: 'button.play', ratio: 2.1, foreground: '#888', background: '#aaa' },
          ],
        },
      }),
      [],
      true
    );

    const f743 = findings.find((f) => f.clauseId === '7.4.3');
    assert.ok(f743);
    assert.equal(f743.status, 'fail');
  });

  it('reports 7.4.4 as pass when all touch targets meet minimum', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        touchTargets: {
          controlsChecked: 3,
          undersizedControls: [],
          allMeetMinimum: true,
        },
      }),
      [],
      true
    );

    const f744 = findings.find((f) => f.clauseId === '7.4.4');
    assert.ok(f744);
    assert.equal(f744.status, 'pass');
  });

  it('reports 7.4.4 as fail when touch targets are undersized', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility({
        touchTargets: {
          controlsChecked: 2,
          undersizedControls: [{ selector: 'button.cc', width: 16, height: 16 }],
          allMeetMinimum: false,
        },
      }),
      [],
      true
    );

    const f744 = findings.find((f) => f.clauseId === '7.4.4');
    assert.ok(f744);
    assert.equal(f744.status, 'fail');
  });
});

// ---- Clause 7.1.5: Live caption delivery ----

describe('Clause 7.1.5 — Live caption delivery', () => {
  it('reports not_applicable when not a live stream', () => {
    const liveDetection: LiveDetectionResult = {
      isLive: false,
      isVOD: true,
      confidence: 'high',
      indicators: ['HLS manifest has #EXT-X-PLAYLIST-TYPE:VOD'],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      liveDetection
    );

    const f715 = findings.find((f) => f.clauseId === '7.1.5');
    assert.ok(f715);
    assert.equal(f715.status, 'not_applicable');
  });

  it('reports pass when live stream has captions', () => {
    const liveDetection: LiveDetectionResult = {
      isLive: true,
      isVOD: false,
      confidence: 'high',
      indicators: ['HLS manifest has #EXT-X-PLAYLIST-TYPE:EVENT'],
    };

    const findings = mapToClause7(
      makeCaptions({
        hasCaptions: true,
        domTracks: [{ kind: 'captions', src: 'c.vtt', srclang: 'en', label: 'English', parentSelector: 'video' }],
      }),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      liveDetection
    );

    const f715 = findings.find((f) => f.clauseId === '7.1.5');
    assert.ok(f715);
    assert.equal(f715.status, 'pass');
  });

  it('reports fail when live stream has no captions', () => {
    const liveDetection: LiveDetectionResult = {
      isLive: true,
      isVOD: false,
      confidence: 'high',
      indicators: ['DASH MPD type="dynamic"'],
    };

    const findings = mapToClause7(
      makeCaptions({ hasCaptions: false }),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      liveDetection
    );

    const f715 = findings.find((f) => f.clauseId === '7.1.5');
    assert.ok(f715);
    assert.equal(f715.status, 'fail');
  });
});

// ---- Clause 7.5.1: DRM accessibility ----

describe('Clause 7.5.1 — DRM accessibility', () => {
  it('reports pass when no DRM is used', () => {
    const drm: DrmCheckResult = {
      usesEME: false,
      drmSystems: [],
      captionsOutsideDRM: null,
      hasAccessibleFallback: null,
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      drm
    );

    const f751 = findings.find((f) => f.clauseId === '7.5.1');
    assert.ok(f751);
    assert.equal(f751.status, 'pass');
  });

  it('reports pass when DRM is used but captions are outside DRM', () => {
    const drm: DrmCheckResult = {
      usesEME: true,
      drmSystems: ['widevine'],
      captionsOutsideDRM: true,
      hasAccessibleFallback: false,
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      drm
    );

    const f751 = findings.find((f) => f.clauseId === '7.5.1');
    assert.ok(f751);
    assert.equal(f751.status, 'pass');
    assert.ok(f751.evidence.includes('widevine'));
  });

  it('reports fail when DRM is used and captions are inside DRM', () => {
    const drm: DrmCheckResult = {
      usesEME: true,
      drmSystems: ['widevine', 'playready'],
      captionsOutsideDRM: false,
      hasAccessibleFallback: false,
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      drm
    );

    const f751 = findings.find((f) => f.clauseId === '7.5.1');
    assert.ok(f751);
    assert.equal(f751.status, 'fail');
  });
});

// ---- Clause 7.5.2: Iframe player accessibility ----

describe('Clause 7.5.2 — Iframe accessibility', () => {
  it('reports pass when no player iframes found', () => {
    const iframeCheck: IframeCheckResult = {
      iframeCount: 2,
      playerIframes: [
        { src: 'https://ads.example.com', hasTitle: true, title: 'Ad', hasSandbox: false, allowAttributes: [], isPlayerEmbed: false },
      ],
      issues: [],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      undefined,
      iframeCheck
    );

    const f752 = findings.find((f) => f.clauseId === '7.5.2');
    assert.ok(f752);
    assert.equal(f752.status, 'pass');
  });

  it('reports fail when player iframe is missing title', () => {
    const iframeCheck: IframeCheckResult = {
      iframeCount: 1,
      playerIframes: [
        { src: 'https://www.youtube.com/embed/abc', hasTitle: false, hasSandbox: false, allowAttributes: [], isPlayerEmbed: true },
      ],
      issues: [
        { type: 'missing_title', description: 'iframe missing title', iframe: 'https://www.youtube.com/embed/abc' },
      ],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      undefined,
      iframeCheck
    );

    const f752 = findings.find((f) => f.clauseId === '7.5.2');
    assert.ok(f752);
    assert.equal(f752.status, 'fail');
  });

  it('reports pass when player iframe has title and no issues', () => {
    const iframeCheck: IframeCheckResult = {
      iframeCount: 1,
      playerIframes: [
        { src: 'https://www.youtube.com/embed/abc', hasTitle: true, title: 'Video player', hasSandbox: false, allowAttributes: ['fullscreen'], isPlayerEmbed: true },
      ],
      issues: [],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      undefined,
      iframeCheck
    );

    const f752 = findings.find((f) => f.clauseId === '7.5.2');
    assert.ok(f752);
    assert.equal(f752.status, 'pass');
  });
});

// ---- Clause 7.5.3: Adaptive bitrate accessibility ----

describe('Clause 7.5.3 — Adaptive bitrate', () => {
  it('reports not_applicable when no quality levels detected', () => {
    const bitrateCheck: BitrateCheckResult = {
      qualityLevels: 0,
      captionsAvailableAtAllLevels: true,
      adAvailableAtAllLevels: true,
      lowestLevelHasAccessibility: true,
      issues: [],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      bitrateCheck
    );

    const f753 = findings.find((f) => f.clauseId === '7.5.3');
    assert.ok(f753);
    assert.equal(f753.status, 'not_applicable');
  });

  it('reports pass when captions and AD are at all levels', () => {
    const bitrateCheck: BitrateCheckResult = {
      qualityLevels: 4,
      bitrateRange: { min: 500, max: 5000 },
      captionsAvailableAtAllLevels: true,
      adAvailableAtAllLevels: true,
      lowestLevelHasAccessibility: true,
      issues: [],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      bitrateCheck
    );

    const f753 = findings.find((f) => f.clauseId === '7.5.3');
    assert.ok(f753);
    assert.equal(f753.status, 'pass');
  });

  it('reports fail when captions not at all levels', () => {
    const bitrateCheck: BitrateCheckResult = {
      qualityLevels: 3,
      bitrateRange: { min: 500, max: 5000 },
      captionsAvailableAtAllLevels: false,
      adAvailableAtAllLevels: true,
      lowestLevelHasAccessibility: true,
      issues: ['Some HLS quality variants do not reference the SUBTITLES group'],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      bitrateCheck
    );

    const f753 = findings.find((f) => f.clauseId === '7.5.3');
    assert.ok(f753);
    assert.equal(f753.status, 'fail');
  });
});

// ---- Clause 7.1.6: Sign language ----

describe('Clause 7.1.6 — Sign language', () => {
  it('reports not_applicable when no player detected', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      null,
      [],
      false
    );

    const f716 = findings.find((f) => f.clauseId === '7.1.6');
    assert.ok(f716);
    assert.equal(f716.status, 'not_applicable');
  });

  it('reports pass when sign language detected with high confidence', () => {
    const signLanguage: SignLanguageResult = {
      hasSignLanguage: true,
      confidence: 'high',
      indicators: [
        { type: 'manifest_track', description: 'DASH manifest contains Role value="sign"' },
        { type: 'page_element', description: 'Found element matching "[class*=sign-language]"' },
      ],
      recommendations: [],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined, undefined, undefined, undefined, undefined,
      signLanguage
    );

    const f716 = findings.find((f) => f.clauseId === '7.1.6');
    assert.ok(f716);
    assert.equal(f716.status, 'pass');
  });

  it('reports needs_review when sign language detected with medium confidence', () => {
    const signLanguage: SignLanguageResult = {
      hasSignLanguage: true,
      confidence: 'medium',
      indicators: [
        { type: 'page_element', description: 'Found element matching "[aria-label*=sign language]"' },
      ],
      recommendations: [],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined, undefined, undefined, undefined, undefined,
      signLanguage
    );

    const f716 = findings.find((f) => f.clauseId === '7.1.6');
    assert.ok(f716);
    assert.equal(f716.status, 'needs_review');
  });

  it('reports needs_review when no sign language detected', () => {
    const signLanguage: SignLanguageResult = {
      hasSignLanguage: false,
      confidence: 'low',
      indicators: [],
      recommendations: ['No sign language provisions detected.'],
    };

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined, undefined, undefined, undefined, undefined,
      signLanguage
    );

    const f716 = findings.find((f) => f.clauseId === '7.1.6');
    assert.ok(f716);
    assert.equal(f716.status, 'needs_review');
  });
});

// ---- Clause 7.6.1: SDK known issues ----

describe('Clause 7.6.1 — SDK known issues', () => {
  it('reports pass when no known issues for SDK', () => {
    const sdkKnownIssues: SDKKnownIssuesResult[] = [{
      sdk: 'plyr',
      sdkDisplayName: 'Plyr',
      version: '3.7.8',
      knownIssues: [],
      recommendations: [],
    }];

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined, undefined, undefined, undefined, undefined, undefined,
      sdkKnownIssues
    );

    const f761 = findings.find((f) => f.clauseId === '7.6.1');
    assert.ok(f761);
    assert.equal(f761.status, 'pass');
  });

  it('reports fail when critical SDK issues exist', () => {
    const sdkKnownIssues: SDKKnownIssuesResult[] = [{
      sdk: 'videojs',
      sdkDisplayName: 'Video.js',
      version: '7.10.0',
      knownIssues: [
        {
          id: 'videojs-settings-keyboard-trap',
          severity: 'critical',
          title: 'Settings menu keyboard trap',
          description: 'Keyboard trap in settings menu.',
          affectedVersions: '< 7.21',
          fixedIn: '7.21.0',
        },
      ],
      recommendations: ['Upgrade Video.js to 7.21.0 or later.'],
    }];

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined, undefined, undefined, undefined, undefined, undefined,
      sdkKnownIssues
    );

    const f761 = findings.find((f) => f.clauseId === '7.6.1');
    assert.ok(f761);
    assert.equal(f761.status, 'fail');
    assert.ok(f761.evidence.includes('Video.js'));
    assert.ok(f761.evidence.includes('7.21.0'));
  });

  it('reports needs_review when only major SDK issues exist', () => {
    const sdkKnownIssues: SDKKnownIssuesResult[] = [{
      sdk: 'hls.js',
      sdkDisplayName: 'hls.js',
      version: '1.4.0',
      knownIssues: [
        {
          id: 'hlsjs-subtitle-default',
          severity: 'major',
          title: 'DEFAULT subtitle tracks may not auto-enable',
          description: 'Subtitles may need manual enabling.',
          affectedVersions: 'all',
        },
      ],
      recommendations: [],
    }];

    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true,
      undefined, undefined, undefined, undefined, undefined, undefined,
      sdkKnownIssues
    );

    const f761 = findings.find((f) => f.clauseId === '7.6.1');
    assert.ok(f761);
    assert.equal(f761.status, 'needs_review');
  });
});

// ---- All clauses present ----

describe('Clause 7 mapper — completeness', () => {
  it('produces findings for all expected clauses', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const clauseIds = findings.map((f) => f.clauseId).sort();
    assert.deepEqual(clauseIds, ALL_CLAUSE_IDS.sort());
  });

  it('every finding has a helpText', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    for (const f of findings) {
      assert.ok(f.helpText, `${f.clauseId} should have helpText`);
      assert.ok(f.helpText.length > 10, `${f.clauseId} helpText should be meaningful`);
    }
  });

  it('every finding has a severity', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const validSeverities = ['critical', 'major', 'minor'];
    for (const f of findings) {
      assert.ok(validSeverities.includes(f.severity), `${f.clauseId} has invalid severity: ${f.severity}`);
    }
  });
});
