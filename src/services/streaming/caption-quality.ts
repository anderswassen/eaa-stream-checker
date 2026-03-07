import type { Page } from 'playwright-core';

// --- Types ---

export interface CaptionSource {
  url: string;
  language?: string;
  source: 'dom' | 'manifest' | 'player_api';
}

export interface CaptionQualityResult {
  analyzed: boolean;
  captionUrl?: string;
  format?: 'webvtt' | 'ttml' | 'srt' | 'unknown';
  cueCount: number;
  issues: CaptionIssue[];
  syncScore: 'good' | 'acceptable' | 'poor' | 'unknown';
}

export interface CaptionIssue {
  type:
    | 'empty_cue'
    | 'overlapping'
    | 'excessive_gap'
    | 'non_sequential'
    | 'too_short'
    | 'too_long'
    | 'invalid_format';
  description: string;
  timestamp?: string;
}

interface ParsedCue {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

// --- Timestamp Parsing ---

/** Parse "HH:MM:SS.mmm" or "MM:SS.mmm" to seconds */
function parseVttTimestamp(ts: string): number {
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return m * 60 + s;
  }
  return NaN;
}

/** Parse "HH:MM:SS,mmm" (SRT uses comma) to seconds */
function parseSrtTimestamp(ts: string): number {
  return parseVttTimestamp(ts.replace(',', '.'));
}

/** Parse TTML timestamps — supports "HH:MM:SS.mmm", "HH:MM:SS:FF", or seconds "123.4s" */
function parseTtmlTimestamp(ts: string): number {
  const trimmed = ts.trim();
  if (trimmed.endsWith('s')) {
    return parseFloat(trimmed.slice(0, -1));
  }
  // HH:MM:SS.mmm or HH:MM:SS:FF
  return parseVttTimestamp(trimmed.replace(/(\d):(\d{2})$/, '$1.$2'));
}

// --- Format Detection ---

function detectFormat(url: string, content: string): 'webvtt' | 'srt' | 'ttml' | 'unknown' {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.vtt') || lowerUrl.includes('.vtt?')) return 'webvtt';
  if (lowerUrl.endsWith('.srt') || lowerUrl.includes('.srt?')) return 'srt';
  if (
    lowerUrl.endsWith('.ttml') ||
    lowerUrl.endsWith('.dfxp') ||
    lowerUrl.includes('.ttml?') ||
    lowerUrl.includes('.dfxp?') ||
    lowerUrl.endsWith('.xml')
  ) {
    return 'ttml';
  }

  // Content-based detection
  const trimmed = content.trimStart();
  if (trimmed.startsWith('WEBVTT')) return 'webvtt';
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<tt')) return 'ttml';
  // SRT starts with a number line
  if (/^\d+\s*\r?\n\d{2}:\d{2}:\d{2}[,.]/.test(trimmed)) return 'srt';

  return 'unknown';
}

// --- WebVTT Parser ---

function parseWebVTT(content: string): { cues: ParsedCue[]; issues: CaptionIssue[] } {
  const issues: CaptionIssue[] = [];
  const cues: ParsedCue[] = [];

  const trimmed = content.trimStart();
  if (!trimmed.startsWith('WEBVTT')) {
    issues.push({
      type: 'invalid_format',
      description: 'WebVTT file does not start with "WEBVTT" header.',
    });
  }

  // Split into blocks separated by blank lines
  const blocks = content.split(/\r?\n\r?\n/);
  let cueIndex = 0;

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    // Find the timestamp line (contains "-->")
    let tsLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsLine = lines[tsLineIdx];
    const tsParts = tsLine.split('-->');
    if (tsParts.length !== 2) continue;

    const startSeconds = parseVttTimestamp(tsParts[0].trim().split(/\s+/)[0]);
    const endSeconds = parseVttTimestamp(tsParts[1].trim().split(/\s+/)[0]);

    if (isNaN(startSeconds) || isNaN(endSeconds)) continue;

    const textLines = lines.slice(tsLineIdx + 1);
    const text = textLines.join('\n').trim();

    cues.push({ index: cueIndex++, startSeconds, endSeconds, text });
  }

  return { cues, issues };
}

// --- SRT Parser ---

function parseSRT(content: string): { cues: ParsedCue[]; issues: CaptionIssue[] } {
  const issues: CaptionIssue[] = [];
  const cues: ParsedCue[] = [];

  const blocks = content.split(/\r?\n\r?\n/);
  let cueIndex = 0;

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length < 2) continue;

    // Find the timestamp line
    let tsLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsLine = lines[tsLineIdx];
    const tsParts = tsLine.split('-->');
    if (tsParts.length !== 2) continue;

    const startSeconds = parseSrtTimestamp(tsParts[0].trim());
    const endSeconds = parseSrtTimestamp(tsParts[1].trim());

    if (isNaN(startSeconds) || isNaN(endSeconds)) continue;

    const textLines = lines.slice(tsLineIdx + 1);
    const text = textLines.join('\n').trim();

    cues.push({ index: cueIndex++, startSeconds, endSeconds, text });
  }

  return { cues, issues };
}

// --- TTML Parser ---

function parseTTML(content: string): { cues: ParsedCue[]; issues: CaptionIssue[] } {
  const issues: CaptionIssue[] = [];
  const cues: ParsedCue[] = [];

  // Match <p> elements with begin/end attributes
  const pRegex = /<p\s[^>]*begin\s*=\s*"([^"]*)"[^>]*end\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  let cueIndex = 0;

  while ((match = pRegex.exec(content)) !== null) {
    const startSeconds = parseTtmlTimestamp(match[1]);
    const endSeconds = parseTtmlTimestamp(match[2]);

    if (isNaN(startSeconds) || isNaN(endSeconds)) continue;

    // Strip tags from text content
    const text = match[3].replace(/<[^>]*>/g, '').trim();

    cues.push({ index: cueIndex++, startSeconds, endSeconds, text });
  }

  // Also try begin/dur pattern (duration instead of end)
  if (cues.length === 0) {
    const durRegex =
      /<p\s[^>]*begin\s*=\s*"([^"]*)"[^>]*dur\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = durRegex.exec(content)) !== null) {
      const startSeconds = parseTtmlTimestamp(match[1]);
      const durSeconds = parseTtmlTimestamp(match[2]);

      if (isNaN(startSeconds) || isNaN(durSeconds)) continue;

      const text = match[3].replace(/<[^>]*>/g, '').trim();
      cues.push({
        index: cueIndex++,
        startSeconds,
        endSeconds: startSeconds + durSeconds,
        text,
      });
    }
  }

  if (cues.length === 0) {
    issues.push({
      type: 'invalid_format',
      description: 'No timed text elements (<p> with begin/end) found in TTML file.',
    });
  }

  return { cues, issues };
}

// --- Cue Validation ---

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.padStart(6, '0')}`;
}

function validateCues(cues: ParsedCue[]): {
  issues: CaptionIssue[];
  hasSequentialTimestamps: boolean;
  hasNoOverlappingCues: boolean;
  hasNoEmptyCues: boolean;
  maxGapSeconds: number;
  hasExcessiveGaps: boolean;
  averageCueDuration: number;
  hasReasonableDurations: boolean;
} {
  const issues: CaptionIssue[] = [];
  let hasSequentialTimestamps = true;
  let hasNoOverlappingCues = true;
  let hasNoEmptyCues = true;
  let maxGapSeconds = 0;
  let hasExcessiveGaps = false;
  let hasReasonableDurations = true;
  let totalDuration = 0;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const duration = cue.endSeconds - cue.startSeconds;
    totalDuration += duration;

    // Check empty cues
    if (!cue.text || cue.text.length === 0) {
      hasNoEmptyCues = false;
      issues.push({
        type: 'empty_cue',
        description: `Cue ${i + 1} has empty text content.`,
        timestamp: formatTimestamp(cue.startSeconds),
      });
    }

    // Check unreasonable durations
    if (duration < 0.5) {
      hasReasonableDurations = false;
      issues.push({
        type: 'too_short',
        description: `Cue ${i + 1} duration is ${duration.toFixed(2)}s (< 0.5s minimum).`,
        timestamp: formatTimestamp(cue.startSeconds),
      });
    } else if (duration > 30) {
      hasReasonableDurations = false;
      issues.push({
        type: 'too_long',
        description: `Cue ${i + 1} duration is ${duration.toFixed(1)}s (> 30s maximum).`,
        timestamp: formatTimestamp(cue.startSeconds),
      });
    }

    // Compare with previous cue
    if (i > 0) {
      const prev = cues[i - 1];

      // Check sequential timestamps
      if (cue.startSeconds < prev.startSeconds) {
        hasSequentialTimestamps = false;
        issues.push({
          type: 'non_sequential',
          description: `Cue ${i + 1} starts at ${formatTimestamp(cue.startSeconds)} which is before cue ${i} start at ${formatTimestamp(prev.startSeconds)}.`,
          timestamp: formatTimestamp(cue.startSeconds),
        });
      }

      // Check overlapping (cue starts before previous ends, with small tolerance)
      if (cue.startSeconds < prev.endSeconds - 0.001) {
        hasNoOverlappingCues = false;
        issues.push({
          type: 'overlapping',
          description: `Cue ${i + 1} (${formatTimestamp(cue.startSeconds)}) overlaps with cue ${i} (ends ${formatTimestamp(prev.endSeconds)}).`,
          timestamp: formatTimestamp(cue.startSeconds),
        });
      }

      // Check gaps
      const gap = cue.startSeconds - prev.endSeconds;
      if (gap > maxGapSeconds) {
        maxGapSeconds = gap;
      }
      if (gap > 10) {
        hasExcessiveGaps = true;
        issues.push({
          type: 'excessive_gap',
          description: `${gap.toFixed(1)}s gap between cue ${i} and cue ${i + 1}. May indicate missing captions.`,
          timestamp: formatTimestamp(prev.endSeconds),
        });
      }
    }
  }

  const averageCueDuration = cues.length > 0 ? totalDuration / cues.length : 0;

  return {
    issues,
    hasSequentialTimestamps,
    hasNoOverlappingCues,
    hasNoEmptyCues,
    maxGapSeconds,
    hasExcessiveGaps,
    averageCueDuration,
    hasReasonableDurations,
  };
}

// --- Sync Score Calculation ---

function calculateSyncScore(
  cueCount: number,
  validation: ReturnType<typeof validateCues>
): 'good' | 'acceptable' | 'poor' | 'unknown' {
  if (cueCount === 0) return 'unknown';

  const {
    hasSequentialTimestamps,
    hasNoOverlappingCues,
    hasNoEmptyCues,
    hasExcessiveGaps,
    hasReasonableDurations,
  } = validation;

  // Count the number of quality problems
  let problems = 0;
  if (!hasSequentialTimestamps) problems += 2; // severe
  if (!hasNoOverlappingCues) problems += 1;
  if (!hasNoEmptyCues) problems += 1;
  if (hasExcessiveGaps) problems += 1;
  if (!hasReasonableDurations) problems += 1;

  if (problems === 0) return 'good';
  if (problems <= 2) return 'acceptable';
  return 'poor';
}

// --- Download Caption File ---

async function downloadCaptionFile(
  page: Page,
  url: string
): Promise<string | null> {
  try {
    const content = await page.evaluate(async (captionUrl: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(captionUrl, {
          signal: controller.signal,
          credentials: 'include',
        });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        return await response.text();
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    }, url);
    return content;
  } catch {
    return null;
  }
}

/** Try to resolve a relative URI against a manifest base URL */
function resolveUrl(uri: string, baseUrl: string): string {
  try {
    return new URL(uri, baseUrl).href;
  } catch {
    return uri;
  }
}

// --- Main Export ---

export async function analyzeCaptionQuality(
  page: Page,
  captionSources: CaptionSource[],
  manifestBaseUrls: string[] = []
): Promise<CaptionQualityResult> {
  if (captionSources.length === 0) {
    return {
      analyzed: false,
      cueCount: 0,
      issues: [],
      syncScore: 'unknown',
    };
  }

  // Try to download the first available caption file
  let content: string | null = null;
  let usedUrl: string | null = null;

  for (const source of captionSources) {
    let url = source.url;

    // Try direct URL first
    content = await downloadCaptionFile(page, url);
    if (content) {
      usedUrl = url;
      break;
    }

    // If relative, try resolving against manifest base URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      for (const baseUrl of manifestBaseUrls) {
        const resolved = resolveUrl(url, baseUrl);
        content = await downloadCaptionFile(page, resolved);
        if (content) {
          usedUrl = resolved;
          break;
        }
      }
      if (content) break;
    }
  }

  if (!content || !usedUrl) {
    return {
      analyzed: false,
      cueCount: 0,
      issues: [],
      syncScore: 'unknown',
    };
  }

  // Detect format and parse
  const format = detectFormat(usedUrl, content);
  let cues: ParsedCue[] = [];
  let parseIssues: CaptionIssue[] = [];

  switch (format) {
    case 'webvtt': {
      const result = parseWebVTT(content);
      cues = result.cues;
      parseIssues = result.issues;
      break;
    }
    case 'srt': {
      const result = parseSRT(content);
      cues = result.cues;
      parseIssues = result.issues;
      break;
    }
    case 'ttml': {
      const result = parseTTML(content);
      cues = result.cues;
      parseIssues = result.issues;
      break;
    }
    default:
      return {
        analyzed: true,
        captionUrl: usedUrl,
        format: 'unknown',
        cueCount: 0,
        issues: [
          {
            type: 'invalid_format',
            description: 'Could not determine caption file format.',
          },
        ],
        syncScore: 'unknown',
      };
  }

  // Validate cues
  const validation = validateCues(cues);
  const allIssues = [...parseIssues, ...validation.issues];
  const syncScore = calculateSyncScore(cues.length, validation);

  return {
    analyzed: true,
    captionUrl: usedUrl,
    format,
    cueCount: cues.length,
    issues: allIssues,
    syncScore,
  };
}
