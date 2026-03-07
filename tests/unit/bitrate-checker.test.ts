import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkBitrate } from '../../src/services/streaming/bitrate-checker.js';
import type { ManifestInfo } from '../../src/services/streaming/types.js';

function makeHLSManifest(rawContent: string, overrides: Partial<ManifestInfo> = {}): ManifestInfo {
  return {
    url: 'https://example.com/master.m3u8',
    type: 'hls',
    subtitleTracks: [],
    audioTracks: [],
    rawContent,
    ...overrides,
  };
}

function makeDASHManifest(rawContent: string, overrides: Partial<ManifestInfo> = {}): ManifestInfo {
  return {
    url: 'https://example.com/manifest.mpd',
    type: 'dash',
    subtitleTracks: [],
    audioTracks: [],
    rawContent,
    ...overrides,
  };
}

describe('Bitrate checker — HLS', () => {
  it('returns 0 quality levels when no manifests provided', () => {
    const result = checkBitrate([]);
    assert.equal(result.qualityLevels, 0);
    assert.equal(result.issues.length, 0);
  });

  it('counts quality levels from STREAM-INF lines', () => {
    const manifest = makeHLSManifest(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360,SUBTITLES="subs"
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720,SUBTITLES="subs"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,SUBTITLES="subs"
1080p.m3u8`, {
      subtitleTracks: [{ language: 'en', name: 'English', uri: 'subs/en.m3u8', isDefault: true, autoSelect: true, forced: false }],
    });

    const result = checkBitrate([manifest]);
    assert.equal(result.qualityLevels, 3);
    assert.ok(result.bitrateRange);
    assert.equal(result.bitrateRange.min, 1000);
    assert.equal(result.bitrateRange.max, 5000);
    assert.equal(result.captionsAvailableAtAllLevels, true);
  });

  it('detects missing SUBTITLES group reference', () => {
    const manifest = makeHLSManifest(`#EXTM3U
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",DEFAULT=YES,URI="subs/en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720
720p.m3u8`, {
      subtitleTracks: [{ language: 'en', name: 'English', uri: 'subs/en.m3u8', isDefault: true, autoSelect: true, forced: false }],
    });

    const result = checkBitrate([manifest]);
    assert.equal(result.qualityLevels, 2);
    assert.equal(result.captionsAvailableAtAllLevels, false);
    assert.ok(result.issues.length > 0);
  });

  it('detects missing audio description', () => {
    const manifest = makeHLSManifest(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2000000,SUBTITLES="subs"
720p.m3u8`, {
      subtitleTracks: [{ language: 'en', name: 'English', uri: 'subs/en.m3u8', isDefault: true, autoSelect: true, forced: false }],
      audioTracks: [
        { language: 'en', name: 'English', uri: 'audio/en.m3u8', isDefault: true, autoSelect: true, isAudioDescription: false, characteristics: null },
      ],
    });

    const result = checkBitrate([manifest]);
    assert.equal(result.adAvailableAtAllLevels, false);
  });

  it('returns 0 quality levels for manifest without STREAM-INF', () => {
    const manifest = makeHLSManifest(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:10,
segment001.ts
#EXTINF:10,
segment002.ts`);

    const result = checkBitrate([manifest]);
    assert.equal(result.qualityLevels, 0);
  });
});

describe('Bitrate checker — DASH', () => {
  it('counts video Representations', () => {
    const manifest = makeDASHManifest(`<?xml version="1.0"?>
<MPD>
  <Period>
    <AdaptationSet contentType="video" mimeType="video/mp4">
      <Representation id="v1" bandwidth="1000000" width="640" height="360" />
      <Representation id="v2" bandwidth="3000000" width="1280" height="720" />
      <Representation id="v3" bandwidth="6000000" width="1920" height="1080" />
    </AdaptationSet>
    <AdaptationSet contentType="text" mimeType="text/vtt" lang="en" label="English">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="subtitle" />
      <Representation id="s1" bandwidth="1000">
        <BaseURL>subs/en.vtt</BaseURL>
      </Representation>
    </AdaptationSet>
    <AdaptationSet contentType="audio" mimeType="audio/mp4" lang="en">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="description" />
      <Representation id="a1" bandwidth="128000" />
    </AdaptationSet>
  </Period>
</MPD>`, {
      subtitleTracks: [{ language: 'en', name: 'English', uri: 'subs/en.vtt', isDefault: false, autoSelect: false, forced: false }],
    });

    const result = checkBitrate([manifest]);
    assert.equal(result.qualityLevels, 3);
    assert.ok(result.bitrateRange);
    assert.equal(result.bitrateRange.min, 1000);
    assert.equal(result.bitrateRange.max, 6000);
    assert.equal(result.captionsAvailableAtAllLevels, true);
    assert.equal(result.adAvailableAtAllLevels, true);
  });

  it('detects missing text AdaptationSet', () => {
    const manifest = makeDASHManifest(`<?xml version="1.0"?>
<MPD>
  <Period>
    <AdaptationSet contentType="video" mimeType="video/mp4">
      <Representation id="v1" bandwidth="2000000" width="1280" height="720" />
    </AdaptationSet>
    <AdaptationSet contentType="audio" mimeType="audio/mp4" lang="en">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main" />
      <Representation id="a1" bandwidth="128000" />
    </AdaptationSet>
  </Period>
</MPD>`);

    const result = checkBitrate([manifest]);
    assert.equal(result.qualityLevels, 1);
    assert.equal(result.captionsAvailableAtAllLevels, false);
    assert.equal(result.adAvailableAtAllLevels, false);
  });
});

describe('Bitrate checker — mixed', () => {
  it('returns result with more quality levels when both HLS and DASH exist', () => {
    const hls = makeHLSManifest(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000
720p.m3u8`);

    const dash = makeDASHManifest(`<?xml version="1.0"?>
<MPD>
  <Period>
    <AdaptationSet contentType="video" mimeType="video/mp4">
      <Representation id="v1" bandwidth="1000000" />
      <Representation id="v2" bandwidth="2000000" />
      <Representation id="v3" bandwidth="4000000" />
    </AdaptationSet>
  </Period>
</MPD>`);

    const result = checkBitrate([hls, dash]);
    // DASH has 3 quality levels, HLS has 2 — should use DASH
    assert.equal(result.qualityLevels, 3);
  });
});
