import type { ManifestInfo } from './types.js';

export interface BitrateCheckResult {
  qualityLevels: number;
  bitrateRange?: { min: number; max: number };
  captionsAvailableAtAllLevels: boolean;
  adAvailableAtAllLevels: boolean;
  lowestLevelHasAccessibility: boolean;
  issues: string[];
}

function parseHLSBitrate(manifests: ManifestInfo[]): BitrateCheckResult {
  const issues: string[] = [];
  let totalQualityLevels = 0;
  const allBandwidths: number[] = [];
  let captionsAtAll = true;
  let adAtAll = true;

  for (const manifest of manifests) {
    if (manifest.type !== 'hls' || !manifest.rawContent) continue;

    const content = manifest.rawContent;
    const lines = content.split('\n');

    // Extract STREAM-INF lines
    const streamInfLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        streamInfLines.push(line);
      }
    }

    if (streamInfLines.length === 0) continue;

    totalQualityLevels += streamInfLines.length;

    // Extract bandwidths
    for (const line of streamInfLines) {
      const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
      if (bwMatch) {
        allBandwidths.push(parseInt(bwMatch[1], 10) / 1000); // Convert to kbps
      }
    }

    // Check if SUBTITLES group is referenced in STREAM-INF
    const hasSubtitlesGroup = manifest.subtitleTracks.length > 0;
    for (const line of streamInfLines) {
      const subtitlesMatch = line.match(/SUBTITLES="([^"]*)"/i);
      if (!subtitlesMatch && hasSubtitlesGroup) {
        // Subtitle group exists but this variant doesn't reference it
        captionsAtAll = false;
        issues.push('Some HLS quality variants do not reference the SUBTITLES group');
        break;
      }
    }

    // Check if AUDIO group with AD is referenced
    const hasADTrack = manifest.audioTracks.some((t) => t.isAudioDescription);
    if (!hasADTrack && manifest.audioTracks.length > 0) {
      // Audio tracks exist but none are AD
      adAtAll = false;
    }
  }

  if (totalQualityLevels === 0) {
    return {
      qualityLevels: 0,
      captionsAvailableAtAllLevels: true,
      adAvailableAtAllLevels: true,
      lowestLevelHasAccessibility: true,
      issues: [],
    };
  }

  const bitrateRange = allBandwidths.length > 0
    ? {
        min: Math.round(Math.min(...allBandwidths)),
        max: Math.round(Math.max(...allBandwidths)),
      }
    : undefined;

  // At the lowest level, accessibility features should still be available
  // In HLS, if subtitle and audio groups are referenced at all levels, they are available at lowest too
  const lowestLevelHasAccessibility = captionsAtAll || adAtAll;

  return {
    qualityLevels: totalQualityLevels,
    bitrateRange,
    captionsAvailableAtAllLevels: captionsAtAll,
    adAvailableAtAllLevels: adAtAll,
    lowestLevelHasAccessibility,
    issues,
  };
}

function parseDASHBitrate(manifests: ManifestInfo[]): BitrateCheckResult {
  const issues: string[] = [];
  let totalQualityLevels = 0;
  const allBandwidths: number[] = [];
  let captionsAtAll = true;
  let adAtAll = true;

  for (const manifest of manifests) {
    if (manifest.type !== 'dash' || !manifest.rawContent) continue;

    const content = manifest.rawContent;

    // Count video Representations
    const adaptationSetRegex = /<AdaptationSet[^>]*>([\s\S]*?)<\/AdaptationSet>/gi;
    let match: RegExpExecArray | null;

    let hasTextAdaptationSet = false;
    let hasADAudioAdaptationSet = false;

    while ((match = adaptationSetRegex.exec(content)) !== null) {
      const block = match[0];
      const inner = match[1];

      const contentType = extractAttr(block, 'contentType');
      const mimeType = extractAttr(block, 'mimeType');

      const isVideo =
        contentType === 'video' || mimeType?.startsWith('video/');
      const isText =
        contentType === 'text' ||
        mimeType?.includes('ttml') ||
        mimeType?.includes('vtt') ||
        mimeType?.includes('text');
      const isAudio =
        contentType === 'audio' || mimeType?.startsWith('audio/');

      if (isVideo) {
        // Count Representation elements
        const repRegex = /<Representation[^>]*>/gi;
        let repMatch: RegExpExecArray | null;
        while ((repMatch = repRegex.exec(inner)) !== null) {
          totalQualityLevels++;
          const bw = extractAttr(repMatch[0], 'bandwidth');
          if (bw) {
            allBandwidths.push(parseInt(bw, 10) / 1000);
          }
        }
      }

      if (isText) {
        hasTextAdaptationSet = true;
      }

      if (isAudio) {
        // Check for description role
        const roleRegex = /<Role[^>]*value="([^"]*)"[^>]*\/>/gi;
        let roleMatch: RegExpExecArray | null;
        while ((roleMatch = roleRegex.exec(inner)) !== null) {
          if (roleMatch[1].toLowerCase() === 'description' || roleMatch[1].toLowerCase() === 'commentary') {
            hasADAudioAdaptationSet = true;
          }
        }
      }
    }

    // In DASH, text AdaptationSets are separate from video, so they are available at all quality levels by default
    if (!hasTextAdaptationSet && manifest.subtitleTracks.length === 0) {
      captionsAtAll = false;
    }

    if (!hasADAudioAdaptationSet && !manifest.audioTracks.some((t) => t.isAudioDescription)) {
      adAtAll = false;
    }
  }

  if (totalQualityLevels === 0) {
    return {
      qualityLevels: 0,
      captionsAvailableAtAllLevels: true,
      adAvailableAtAllLevels: true,
      lowestLevelHasAccessibility: true,
      issues: [],
    };
  }

  const bitrateRange = allBandwidths.length > 0
    ? {
        min: Math.round(Math.min(...allBandwidths)),
        max: Math.round(Math.max(...allBandwidths)),
      }
    : undefined;

  const lowestLevelHasAccessibility = captionsAtAll || adAtAll;

  return {
    qualityLevels: totalQualityLevels,
    bitrateRange,
    captionsAvailableAtAllLevels: captionsAtAll,
    adAvailableAtAllLevels: adAtAll,
    lowestLevelHasAccessibility,
    issues,
  };
}

function extractAttr(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i');
  const match = tag.match(regex);
  return match ? match[1] : null;
}

export function checkBitrate(manifests: ManifestInfo[]): BitrateCheckResult {
  // Combine results from HLS and DASH manifests
  const hlsManifests = manifests.filter((m) => m.type === 'hls');
  const dashManifests = manifests.filter((m) => m.type === 'dash');

  const hlsResult = hlsManifests.length > 0 ? parseHLSBitrate(manifests) : null;
  const dashResult = dashManifests.length > 0 ? parseDASHBitrate(manifests) : null;

  // Merge results if both exist, prefer whichever has more quality levels
  if (hlsResult && dashResult) {
    return hlsResult.qualityLevels >= dashResult.qualityLevels ? hlsResult : dashResult;
  }

  if (hlsResult) return hlsResult;
  if (dashResult) return dashResult;

  return {
    qualityLevels: 0,
    captionsAvailableAtAllLevels: true,
    adAvailableAtAllLevels: true,
    lowestLevelHasAccessibility: true,
    issues: [],
  };
}
