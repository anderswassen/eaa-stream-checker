import type { Page } from 'playwright';
import type { StreamingAnalysisResult } from './types.js';
import { detectPlayers } from './player-detector.js';
import { interceptManifests, parseManifests } from './manifest-parser.js';
import { checkCaptions } from './caption-checker.js';
import { checkAudioDescription } from './audio-description-checker.js';
import { checkPlayerAccessibility } from './player-accessibility.js';
import { mapToClause7 } from './clause7-mapper.js';

export type { StreamingAnalysisResult, StreamingFinding } from './types.js';

/**
 * Analyze a streaming page for EAA/EN 301 549 Clause 7 compliance.
 *
 * Call this BEFORE navigating to the page so that manifest interception
 * can capture HLS/DASH requests. If the page is already loaded, manifests
 * from the initial load won't be captured — call `page.reload()` after
 * setting up interception.
 *
 * Usage:
 *   const { setupInterception, analyze } = prepareStreamingAnalysis(page);
 *   await setupInterception();
 *   await page.goto(url);
 *   const result = await analyze();
 */
export function prepareStreamingAnalysis(page: Page) {
  let interceptedManifests: Awaited<ReturnType<typeof interceptManifests>> | null = null;

  return {
    async setupInterception() {
      interceptedManifests = await interceptManifests(page);
    },
    async analyze(): Promise<StreamingAnalysisResult> {
      const manifests = parseManifests(interceptedManifests ?? []);
      return runAnalysis(page, manifests);
    },
  };
}

/**
 * Analyze a page that is already loaded. Manifests must be provided
 * separately if they were intercepted during page load.
 */
export async function analyzeStreamingPage(
  page: Page
): Promise<StreamingAnalysisResult> {
  // Set up interception and reload to capture manifests
  const intercepted = await interceptManifests(page);

  // Give the page a moment to settle (player initialization, etc.)
  await page.waitForTimeout(1000);

  const manifests = parseManifests(intercepted);
  return runAnalysis(page, manifests);
}

async function runAnalysis(
  page: Page,
  manifests: Awaited<ReturnType<typeof parseManifests>>
): Promise<StreamingAnalysisResult> {
  // Step 1: Detect players
  const players = await detectPlayers(page);
  const playerDetected = players.length > 0;
  const primaryPlayer = players[0] ?? null;

  // Step 2: Check captions and audio description (can run in parallel)
  const [captions, audioDescription] = await Promise.all([
    checkCaptions(page, manifests),
    checkAudioDescription(page, manifests),
  ]);

  // Step 3: Check player accessibility (requires a detected player)
  let playerAccessibility = null;
  if (primaryPlayer) {
    playerAccessibility = await checkPlayerAccessibility(page, primaryPlayer);
  }

  // Step 4: Map findings to EN 301 549 Clause 7
  const findings = mapToClause7(
    captions,
    audioDescription,
    playerAccessibility,
    manifests,
    playerDetected
  );

  return {
    playerDetected,
    playerType: primaryPlayer?.sdk ?? null,
    playerVersion: primaryPlayer?.version ?? null,
    players,
    captions,
    audioDescription,
    playerAccessibility,
    manifests,
    findings,
  };
}
