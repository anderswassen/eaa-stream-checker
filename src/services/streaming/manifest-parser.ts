import type { Page } from 'playwright';
import type { ManifestInfo, ManifestTrack, ManifestAudioTrack } from './types.js';

export interface InterceptedManifest {
  url: string;
  body: string;
  type: 'hls' | 'dash';
}

// --- HLS Parsing ---

function parseHLSAttribute(line: string, attr: string): string | null {
  // Handles both quoted and unquoted attribute values
  const quotedRegex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const unquotedRegex = new RegExp(`${attr}=([^,\\s]*)`, 'i');
  const quotedMatch = line.match(quotedRegex);
  if (quotedMatch) return quotedMatch[1];
  const unquotedMatch = line.match(unquotedRegex);
  if (unquotedMatch) return unquotedMatch[1];
  return null;
}

export function parseHLSManifest(body: string, manifestUrl: string): ManifestInfo {
  const subtitleTracks: ManifestTrack[] = [];
  const audioTracks: ManifestAudioTrack[] = [];

  const lines = body.split('\n');
  for (const line of lines) {
    if (!line.startsWith('#EXT-X-MEDIA:')) continue;

    const type = parseHLSAttribute(line, 'TYPE');
    const language = parseHLSAttribute(line, 'LANGUAGE');
    const name = parseHLSAttribute(line, 'NAME');
    const uri = parseHLSAttribute(line, 'URI');
    const isDefault = parseHLSAttribute(line, 'DEFAULT')?.toUpperCase() === 'YES';
    const autoSelect = parseHLSAttribute(line, 'AUTOSELECT')?.toUpperCase() === 'YES';
    const characteristics = parseHLSAttribute(line, 'CHARACTERISTICS');
    const forced = parseHLSAttribute(line, 'FORCED')?.toUpperCase() === 'YES';

    if (type === 'SUBTITLES') {
      subtitleTracks.push({
        language,
        name,
        uri,
        isDefault,
        autoSelect,
        forced,
      });
    } else if (type === 'AUDIO') {
      const isAD = characteristics
        ? characteristics.includes('public.accessibility.describes-video')
        : false;
      audioTracks.push({
        language,
        name,
        uri,
        isDefault,
        autoSelect,
        isAudioDescription: isAD,
        characteristics,
      });
    }
  }

  return {
    url: manifestUrl,
    type: 'hls',
    subtitleTracks,
    audioTracks,
  };
}

// --- DASH Parsing ---

export function parseDASHManifest(body: string, manifestUrl: string): ManifestInfo {
  const subtitleTracks: ManifestTrack[] = [];
  const audioTracks: ManifestAudioTrack[] = [];

  // Simple XML parsing using regex — DASH manifests are well-structured
  const adaptationSetRegex = /<AdaptationSet[^>]*>([\s\S]*?)<\/AdaptationSet>/gi;
  let match: RegExpExecArray | null;

  while ((match = adaptationSetRegex.exec(body)) !== null) {
    const block = match[0];
    const innerContent = match[1];

    const contentType = extractXMLAttr(block, 'contentType');
    const mimeType = extractXMLAttr(block, 'mimeType');
    const lang = extractXMLAttr(block, 'lang');
    const label = extractXMLAttr(block, 'label');

    // Extract Role elements
    const roleRegex = /<Role[^>]*\/>/gi;
    const roles: string[] = [];
    let roleMatch: RegExpExecArray | null;
    while ((roleMatch = roleRegex.exec(innerContent)) !== null) {
      const value = extractXMLAttr(roleMatch[0], 'value');
      if (value) roles.push(value.toLowerCase());
    }

    const isText =
      contentType === 'text' ||
      mimeType?.includes('ttml') ||
      mimeType?.includes('vtt') ||
      mimeType?.includes('text') ||
      roles.includes('subtitle') ||
      roles.includes('caption');

    const isAudio =
      contentType === 'audio' ||
      mimeType?.startsWith('audio/');

    if (isText) {
      // Extract Representation URIs
      const representationRegex = /<Representation[^>]*>/gi;
      const baseUrlRegex = /<BaseURL>([^<]*)<\/BaseURL>/i;
      let repMatch: RegExpExecArray | null;
      let uri: string | null = null;

      while ((repMatch = representationRegex.exec(innerContent)) !== null) {
        const bandwidth = extractXMLAttr(repMatch[0], 'bandwidth');
        if (bandwidth) {
          const baseUrlMatch = innerContent.match(baseUrlRegex);
          uri = baseUrlMatch ? baseUrlMatch[1] : null;
          break;
        }
      }
      if (!uri) {
        const baseUrlMatch = innerContent.match(baseUrlRegex);
        uri = baseUrlMatch ? baseUrlMatch[1] : null;
      }

      subtitleTracks.push({
        language: lang,
        name: label,
        uri,
        isDefault: roles.includes('main'),
        autoSelect: false,
        forced: roles.includes('forced'),
      });
    } else if (isAudio) {
      const isAD = roles.includes('description') || roles.includes('commentary');
      audioTracks.push({
        language: lang,
        name: label,
        uri: null,
        isDefault: roles.includes('main'),
        autoSelect: false,
        isAudioDescription: isAD,
        characteristics: roles.join(', ') || null,
      });
    }
  }

  return {
    url: manifestUrl,
    type: 'dash',
    subtitleTracks,
    audioTracks,
  };
}

function extractXMLAttr(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i');
  const match = tag.match(regex);
  return match ? match[1] : null;
}

// --- Network Interception ---

export async function interceptManifests(page: Page): Promise<InterceptedManifest[]> {
  const manifests: InterceptedManifest[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';

    const isHLS =
      url.endsWith('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl');

    const isDASH =
      url.endsWith('.mpd') ||
      contentType.includes('dash+xml');

    if (isHLS || isDASH) {
      try {
        const body = await response.text();
        manifests.push({
          url,
          body,
          type: isHLS ? 'hls' : 'dash',
        });
      } catch {
        // Response body may not be available (e.g., redirects)
      }
    }
  });

  return manifests;
}

export function parseManifests(intercepted: InterceptedManifest[]): ManifestInfo[] {
  return intercepted.map((m) => {
    if (m.type === 'hls') {
      return parseHLSManifest(m.body, m.url);
    }
    return parseDASHManifest(m.body, m.url);
  });
}
