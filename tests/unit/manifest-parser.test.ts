import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHLSManifest, parseDASHManifest } from '../../src/services/streaming/manifest-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, '..', 'fixtures', 'manifests');

describe('HLS manifest parser', () => {
  it('extracts subtitle tracks from master.m3u8', () => {
    const body = readFileSync(resolve(FIXTURES, 'master.m3u8'), 'utf-8');
    const result = parseHLSManifest(body, 'https://example.com/master.m3u8');

    assert.equal(result.type, 'hls');
    assert.equal(result.subtitleTracks.length, 2);

    const en = result.subtitleTracks.find((t) => t.language === 'en');
    assert.ok(en, 'English subtitle track should exist');
    assert.equal(en.name, 'English');
    assert.equal(en.isDefault, true);
    assert.equal(en.uri, 'subs/en/playlist.m3u8');

    const sv = result.subtitleTracks.find((t) => t.language === 'sv');
    assert.ok(sv, 'Swedish subtitle track should exist');
    assert.equal(sv.name, 'Svenska');
    assert.equal(sv.isDefault, false);
  });

  it('extracts audio tracks including AD from master.m3u8', () => {
    const body = readFileSync(resolve(FIXTURES, 'master.m3u8'), 'utf-8');
    const result = parseHLSManifest(body, 'https://example.com/master.m3u8');

    assert.equal(result.audioTracks.length, 2);

    const mainAudio = result.audioTracks.find((t) => !t.isAudioDescription);
    assert.ok(mainAudio, 'Main audio track should exist');
    assert.equal(mainAudio.language, 'en');
    assert.equal(mainAudio.isDefault, true);

    const adAudio = result.audioTracks.find((t) => t.isAudioDescription);
    assert.ok(adAudio, 'AD audio track should exist');
    assert.equal(adAudio.isAudioDescription, true);
    assert.ok(
      adAudio.characteristics?.includes('public.accessibility.describes-video'),
      'AD track should have accessibility characteristic'
    );
  });

  it('handles manifest with no subtitles', () => {
    const body = readFileSync(resolve(FIXTURES, 'no-subs.m3u8'), 'utf-8');
    const result = parseHLSManifest(body, 'https://example.com/no-subs.m3u8');

    assert.equal(result.subtitleTracks.length, 0);
    assert.equal(result.audioTracks.length, 1);
    assert.equal(result.audioTracks[0].isAudioDescription, false);
  });

  it('parses inline HLS manifest strings', () => {
    const manifest = `#EXTM3U
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="French",LANGUAGE="fr",DEFAULT=NO,AUTOSELECT=YES,FORCED=YES,URI="subs/fr.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000
video.m3u8`;

    const result = parseHLSManifest(manifest, 'https://example.com/live.m3u8');
    assert.equal(result.subtitleTracks.length, 1);
    assert.equal(result.subtitleTracks[0].language, 'fr');
    assert.equal(result.subtitleTracks[0].forced, true);
    assert.equal(result.subtitleTracks[0].autoSelect, true);
  });
});

describe('DASH manifest parser', () => {
  it('extracts subtitle tracks from manifest.mpd', () => {
    const body = readFileSync(resolve(FIXTURES, 'manifest.mpd'), 'utf-8');
    const result = parseDASHManifest(body, 'https://example.com/manifest.mpd');

    assert.equal(result.type, 'dash');
    assert.equal(result.subtitleTracks.length, 2);

    const en = result.subtitleTracks.find((t) => t.language === 'en');
    assert.ok(en, 'English subtitle track should exist');
    assert.equal(en.name, 'English');
    assert.equal(en.uri, 'subs/en.vtt');

    const sv = result.subtitleTracks.find((t) => t.language === 'sv');
    assert.ok(sv, 'Swedish subtitle track should exist');
    assert.equal(sv.name, 'Svenska');
  });

  it('extracts audio description track from manifest.mpd', () => {
    const body = readFileSync(resolve(FIXTURES, 'manifest.mpd'), 'utf-8');
    const result = parseDASHManifest(body, 'https://example.com/manifest.mpd');

    assert.equal(result.audioTracks.length, 2);

    const adTrack = result.audioTracks.find((t) => t.isAudioDescription);
    assert.ok(adTrack, 'AD audio track should exist');
    assert.equal(adTrack.language, 'en');
    assert.equal(adTrack.name, 'Audio Description');

    const mainTrack = result.audioTracks.find((t) => !t.isAudioDescription);
    assert.ok(mainTrack, 'Main audio track should exist');
    assert.equal(mainTrack.isAudioDescription, false);
  });

  it('parses inline DASH manifest strings', () => {
    const mpd = `<?xml version="1.0"?>
<MPD>
  <Period>
    <AdaptationSet contentType="text" mimeType="application/ttml+xml" lang="de" label="Deutsch">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="caption" />
      <Representation id="c1" bandwidth="500">
        <BaseURL>captions/de.ttml</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;

    const result = parseDASHManifest(mpd, 'https://example.com/live.mpd');
    assert.equal(result.subtitleTracks.length, 1);
    assert.equal(result.subtitleTracks[0].language, 'de');
    assert.equal(result.subtitleTracks[0].name, 'Deutsch');
    assert.equal(result.subtitleTracks[0].uri, 'captions/de.ttml');
  });
});
