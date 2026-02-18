import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { detectPlayers } from '../../src/services/streaming/player-detector.js';
import { checkCaptions } from '../../src/services/streaming/caption-checker.js';
import { checkAudioDescription } from '../../src/services/streaming/audio-description-checker.js';
import { checkPlayerAccessibility } from '../../src/services/streaming/player-accessibility.js';
import { mapToClause7 } from '../../src/services/streaming/clause7-mapper.js';

// Resolve fixtures relative to process.cwd() so it works from both src/ and dist/
const FIXTURES = resolve(process.cwd(), 'tests', 'fixtures');

function fixtureUrl(name: string): string {
  return pathToFileURL(resolve(FIXTURES, name)).href;
}

let browser: Browser;
let page: Page;

before(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});

after(async () => {
  await browser?.close();
});

describe('Player detection', () => {
  it('detects native video element on compliant-player.html', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const players = await detectPlayers(page);

    assert.ok(players.length > 0, 'Should detect at least one player');
    assert.equal(players[0].sdk, 'native');
    assert.ok(players[0].mediaElements.length > 0, 'Should find media elements');
    assert.equal(players[0].mediaElements[0].tagName, 'video');
  });

  it('detects tracks on media elements', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const players = await detectPlayers(page);

    const videoEl = players[0].mediaElements[0];
    assert.equal(videoEl.hasTracks, true);
    assert.equal(videoEl.trackCount, 3); // captions, subtitles, descriptions
  });

  it('finds video with no tracks on no-captions.html', async () => {
    await page.goto(fixtureUrl('no-captions.html'));
    const players = await detectPlayers(page);

    assert.ok(players.length > 0);
    assert.equal(players[0].mediaElements[0].hasTracks, false);
    assert.equal(players[0].mediaElements[0].trackCount, 0);
  });
});

describe('Caption checker', () => {
  it('finds caption tracks on compliant player', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const result = await checkCaptions(page, []);

    assert.equal(result.hasCaptions, true);
    assert.ok(result.domTracks.length >= 2, 'Should find captions and subtitles tracks');
    assert.equal(result.hasLanguageAttributes, true);

    const enTrack = result.domTracks.find((t) => t.srclang === 'en');
    assert.ok(enTrack, 'Should find English track');
    assert.equal(enTrack.kind, 'captions');
  });

  it('finds no captions on no-captions.html', async () => {
    await page.goto(fixtureUrl('no-captions.html'));
    const result = await checkCaptions(page, []);

    assert.equal(result.hasCaptions, false);
    assert.equal(result.domTracks.length, 0);
  });
});

describe('Audio description checker', () => {
  it('finds description tracks on compliant player', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const result = await checkAudioDescription(page, []);

    assert.equal(result.hasAudioDescription, true);
    assert.ok(result.domDescriptionTracks.length > 0);
    assert.equal(result.domDescriptionTracks[0].kind, 'descriptions');
  });

  it('detects AD button in UI', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const result = await checkAudioDescription(page, []);

    assert.equal(result.hasADSelector, true, 'Should detect AD button');
  });

  it('finds no AD on no-captions.html', async () => {
    await page.goto(fixtureUrl('no-captions.html'));
    const result = await checkAudioDescription(page, []);

    assert.equal(result.hasAudioDescription, false);
  });
});

describe('Player accessibility', () => {
  it('checks keyboard navigation on compliant player', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const players = await detectPlayers(page);
    const result = await checkPlayerAccessibility(page, players[0]);

    assert.equal(result.keyboardNavigation.canTabIntoPlayer, true);
    assert.ok(result.keyboardNavigation.reachableControls.length > 0);
    assert.ok(result.keyboardNavigation.controlsActivatableWithKeyboard, 'Buttons should be keyboard-activatable');
  });

  it('finds ARIA labels on compliant player', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const players = await detectPlayers(page);
    const result = await checkPlayerAccessibility(page, players[0]);

    assert.ok(result.ariaLabels.labeledButtons.length > 0, 'Should find labeled buttons');
    assert.equal(result.ariaLabels.unlabeledButtons.length, 0, 'Should have no unlabeled buttons');
    assert.equal(result.ariaLabels.playerHasRole, true);
    assert.equal(result.ariaLabels.playerHasAccessibleName, true);
  });

  it('finds caption customization on compliant player', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const players = await detectPlayers(page);
    const result = await checkPlayerAccessibility(page, players[0]);

    assert.ok(result.captionCustomization.detectedOptions.length >= 3,
      `Should find 3+ customization options, got: ${result.captionCustomization.detectedOptions.join(', ')}`);
  });

  it('finds no caption customization on caption-no-customize.html', async () => {
    await page.goto(fixtureUrl('caption-no-customize.html'));
    const players = await detectPlayers(page);
    const result = await checkPlayerAccessibility(page, players[0]);

    assert.equal(result.captionCustomization.detectedOptions.length, 0);
  });

  it('detects unlabeled buttons on no-aria.html', async () => {
    await page.goto(fixtureUrl('no-aria.html'));
    const players = await detectPlayers(page);
    const result = await checkPlayerAccessibility(page, players[0]);

    assert.ok(result.ariaLabels.unlabeledButtons.length > 0,
      'Should find unlabeled buttons');
  });

  it('detects lack of keyboard access on no-keyboard.html', async () => {
    await page.goto(fixtureUrl('no-keyboard.html'));
    const players = await detectPlayers(page);
    const result = await checkPlayerAccessibility(page, players[0]);

    // div elements without tabindex are not focusable
    assert.equal(result.keyboardNavigation.canTabIntoPlayer, false,
      'div-based controls should not be keyboard-accessible');
  });
});

describe('End-to-end Clause 7 mapping', () => {
  it('compliant player passes key Clause 7 checks', async () => {
    await page.goto(fixtureUrl('compliant-player.html'));
    const players = await detectPlayers(page);
    const captions = await checkCaptions(page, []);
    const ad = await checkAudioDescription(page, []);
    const accessibility = await checkPlayerAccessibility(page, players[0]);
    const findings = mapToClause7(captions, ad, accessibility, [], true);

    const f711 = findings.find((f) => f.clauseId === '7.1.1');
    assert.equal(f711?.status, 'pass', '7.1.1 should pass');

    const f721 = findings.find((f) => f.clauseId === '7.2.1');
    assert.equal(f721?.status, 'pass', '7.2.1 should pass');

    const f714 = findings.find((f) => f.clauseId === '7.1.4');
    assert.equal(f714?.status, 'pass', '7.1.4 should pass');

    const f73 = findings.find((f) => f.clauseId === '7.3');
    assert.equal(f73?.status, 'pass', '7.3 should pass');
  });

  it('no-captions page fails 7.1.1', async () => {
    await page.goto(fixtureUrl('no-captions.html'));
    const captions = await checkCaptions(page, []);
    const ad = await checkAudioDescription(page, []);
    const players = await detectPlayers(page);
    const accessibility = await checkPlayerAccessibility(page, players[0]);
    const findings = mapToClause7(captions, ad, accessibility, [], true);

    const f711 = findings.find((f) => f.clauseId === '7.1.1');
    assert.equal(f711?.status, 'fail');
  });

  it('no-keyboard page fails 7.3', async () => {
    await page.goto(fixtureUrl('no-keyboard.html'));
    const captions = await checkCaptions(page, []);
    const ad = await checkAudioDescription(page, []);
    const players = await detectPlayers(page);
    const accessibility = await checkPlayerAccessibility(page, players[0]);
    const findings = mapToClause7(captions, ad, accessibility, [], true);

    const f73 = findings.find((f) => f.clauseId === '7.3');
    assert.equal(f73?.status, 'fail');
  });
});
