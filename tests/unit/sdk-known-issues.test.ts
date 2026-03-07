import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lookupKnownIssues } from '../../src/services/streaming/sdk-known-issues.js';
import type { DetectedPlayer } from '../../src/services/streaming/types.js';

function makePlayer(sdk: DetectedPlayer['sdk'], version: string | null = null): DetectedPlayer {
  return {
    sdk,
    version,
    containerSelector: 'video',
    mediaElements: [],
  };
}

describe('SDK Known Issues — lookupKnownIssues', () => {
  it('returns known issues for Video.js', () => {
    const results = lookupKnownIssues([makePlayer('videojs', '7.10.0')]);
    assert.equal(results.length, 1);
    assert.equal(results[0].sdkDisplayName, 'Video.js');
    assert.ok(results[0].knownIssues.length > 0);
  });

  it('filters issues by version — old Video.js has keyboard trap issue', () => {
    const results = lookupKnownIssues([makePlayer('videojs', '7.10.0')]);
    const keyboardTrap = results[0].knownIssues.find((i) => i.id === 'videojs-settings-keyboard-trap');
    assert.ok(keyboardTrap, 'Should find keyboard trap issue for v7.10');
  });

  it('filters issues by version — new Video.js does not have keyboard trap issue', () => {
    const results = lookupKnownIssues([makePlayer('videojs', '8.5.0')]);
    const keyboardTrap = results[0].knownIssues.find((i) => i.id === 'videojs-settings-keyboard-trap');
    assert.equal(keyboardTrap, undefined, 'Should not find keyboard trap issue for v8.5');
  });

  it('returns all issues when version is unknown', () => {
    const results = lookupKnownIssues([makePlayer('videojs', null)]);
    assert.ok(results[0].knownIssues.length > 0, 'Should return issues when version is unknown');
    // Unknown version = assume all issues apply
    const allIssues = results[0].knownIssues;
    assert.ok(allIssues.length >= 3, 'Should return multiple issues for unknown version');
  });

  it('returns issues for JW Player', () => {
    const results = lookupKnownIssues([makePlayer('jwplayer')]);
    assert.equal(results[0].sdkDisplayName, 'JW Player');
    assert.ok(results[0].knownIssues.length > 0);
  });

  it('returns issues for hls.js', () => {
    const results = lookupKnownIssues([makePlayer('hls.js', '1.4.0')]);
    assert.equal(results[0].sdkDisplayName, 'hls.js');
    assert.ok(results[0].knownIssues.length > 0);
  });

  it('returns issues for native HTML5 video', () => {
    const results = lookupKnownIssues([makePlayer('native')]);
    assert.equal(results[0].sdkDisplayName, 'Native HTML5 Video');
    assert.ok(results[0].knownIssues.length > 0);
  });

  it('returns empty issues for unknown SDK', () => {
    const results = lookupKnownIssues([makePlayer('unknown')]);
    assert.equal(results[0].knownIssues.length, 0);
    assert.ok(results[0].recommendations.length > 0, 'Should recommend manual testing');
  });

  it('returns upgrade recommendation when fixable issues exist', () => {
    const results = lookupKnownIssues([makePlayer('videojs', '7.10.0')]);
    const hasUpgradeRec = results[0].recommendations.some((r) => r.includes('Upgrade'));
    assert.ok(hasUpgradeRec, 'Should recommend upgrading');
  });

  it('handles multiple players', () => {
    const results = lookupKnownIssues([
      makePlayer('hls.js', '1.4.0'),
      makePlayer('videojs', '8.0.0'),
    ]);
    assert.equal(results.length, 2);
    assert.equal(results[0].sdkDisplayName, 'hls.js');
    assert.equal(results[1].sdkDisplayName, 'Video.js');
  });

  it('returns Shaka Player issues', () => {
    const results = lookupKnownIssues([makePlayer('shaka', '4.0.0')]);
    assert.equal(results[0].sdkDisplayName, 'Shaka Player');
    const uiIssue = results[0].knownIssues.find((i) => i.id === 'shaka-no-default-ui-a11y');
    assert.ok(uiIssue, 'Should find UI issue for Shaka < 4.3');
  });

  it('filters Shaka Player issues for newer versions', () => {
    const results = lookupKnownIssues([makePlayer('shaka', '4.5.0')]);
    const uiIssue = results[0].knownIssues.find((i) => i.id === 'shaka-no-default-ui-a11y');
    assert.equal(uiIssue, undefined, 'Should not find UI issue for Shaka 4.5');
  });

  it('returns Bitmovin Player issues', () => {
    const results = lookupKnownIssues([makePlayer('bitmovin', '8.100.0')]);
    assert.equal(results[0].sdkDisplayName, 'Bitmovin Player');
    const focusIssue = results[0].knownIssues.find((i) => i.id === 'bitmovin-focus-management');
    assert.ok(focusIssue, 'Should find focus issue for Bitmovin < 8.130');
  });
});
