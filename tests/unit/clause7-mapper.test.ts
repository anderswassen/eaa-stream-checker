import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapToClause7 } from '../../src/services/streaming/clause7-mapper.js';
import type {
  CaptionCheckResult,
  AudioDescriptionCheckResult,
  PlayerAccessibilityResult,
  ManifestInfo,
} from '../../src/services/streaming/types.js';

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

describe('Clause 7 mapper', () => {
  it('returns not_applicable for all clauses when no player detected', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      null,
      [],
      false
    );

    for (const f of findings) {
      assert.equal(f.status, 'not_applicable', `${f.clauseId} should be not_applicable`);
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

  it('produces findings for all expected clauses', () => {
    const findings = mapToClause7(
      makeCaptions(),
      makeAD(),
      makeAccessibility(),
      [],
      true
    );

    const clauseIds = findings.map((f) => f.clauseId).sort();
    assert.deepEqual(clauseIds, ['7.1.1', '7.1.2', '7.1.3', '7.1.4', '7.2.1', '7.2.2', '7.2.3', '7.3']);
  });
});
