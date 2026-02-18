import { useState } from 'react';
import type { Finding } from '../types/report';

interface FixSuggestionProps {
  finding: Finding;
  clauseId: string;
}

interface Suggestion {
  title: string;
  description: string;
  code?: string;
  language?: string;
}

function getSuggestion(finding: Finding, clauseId: string): Suggestion | null {
  const desc = finding.description.toLowerCase();

  // Image alt text
  if (desc.includes('alt') && (desc.includes('image') || desc.includes('img'))) {
    return {
      title: 'Add descriptive alt text',
      description: 'Every <img> element needs an alt attribute describing the image content. Use alt="" only for decorative images.',
      code: `<!-- Before -->\n<img src="hero.jpg">\n\n<!-- After -->\n<img src="hero.jpg" alt="Live hockey match between Team A and Team B">`,
      language: 'html',
    };
  }

  // Color contrast
  if (desc.includes('contrast')) {
    return {
      title: 'Increase color contrast',
      description: 'Text must have a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18px+ bold or 24px+).',
      code: `/* Before - insufficient contrast */\ncolor: #999;\nbackground: #fff;\n\n/* After - meets WCAG AA (4.6:1 ratio) */\ncolor: #595959;\nbackground: #fff;`,
      language: 'css',
    };
  }

  // Missing captions / subtitles
  if (desc.includes('caption') || desc.includes('subtitle')) {
    return {
      title: 'Add closed captions',
      description: 'All video content must have synchronized captions. Provide WebVTT caption tracks in your HLS/DASH manifests.',
      code: `<!-- HLS manifest (m3u8) -->\n#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",\n  NAME="English",LANGUAGE="en",DEFAULT=YES,\n  URI="captions_en.m3u8"\n\n<!-- HTML5 video -->\n<video>\n  <track kind="captions" src="captions.vtt"\n    srclang="en" label="English" default>\n</video>`,
      language: 'html',
    };
  }

  // Audio description
  if (desc.includes('audio description') || desc.includes('audio-description')) {
    return {
      title: 'Provide audio description track',
      description: 'Video content with important visual information needs an audio description track. Include it as a separate audio track in your manifest.',
      code: `<!-- HLS manifest -->\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",\n  NAME="Audio Description",LANGUAGE="en",\n  CHARACTERISTICS="public.accessibility.describes-video",\n  URI="audio_desc_en.m3u8"`,
      language: 'html',
    };
  }

  // Keyboard navigation
  if (desc.includes('keyboard') || desc.includes('focus') || desc.includes('tabindex')) {
    return {
      title: 'Ensure keyboard accessibility',
      description: 'All interactive elements must be operable via keyboard. Use native HTML elements or add proper ARIA roles and keyboard handlers.',
      code: `<!-- Use native buttons instead of divs -->\n<button onClick={handlePlay}>\n  Play\n</button>\n\n<!-- If custom element is needed -->\n<div role="button" tabindex="0"\n  onKeyDown={(e) => {\n    if (e.key === 'Enter' || e.key === ' ') handlePlay();\n  }}>\n  Play\n</div>`,
      language: 'html',
    };
  }

  // ARIA labels
  if (desc.includes('aria') && (desc.includes('label') || desc.includes('name'))) {
    return {
      title: 'Add accessible names',
      description: 'Interactive elements need accessible names via aria-label, aria-labelledby, or visible text content.',
      code: `<!-- Icon-only button -->\n<button aria-label="Play video">\n  <svg>...</svg>\n</button>\n\n<!-- Form input -->\n<label for="search">Search</label>\n<input id="search" type="text">`,
      language: 'html',
    };
  }

  // Heading structure
  if (desc.includes('heading') && (desc.includes('order') || desc.includes('level') || desc.includes('skip'))) {
    return {
      title: 'Fix heading hierarchy',
      description: 'Headings must follow a logical order (h1 → h2 → h3). Don\'t skip levels.',
      code: `<!-- Before - skipped h2 -->\n<h1>Movie Title</h1>\n<h3>Cast</h3>\n\n<!-- After -->\n<h1>Movie Title</h1>\n<h2>Cast</h2>`,
      language: 'html',
    };
  }

  // Link purpose
  if (desc.includes('link') && (desc.includes('purpose') || desc.includes('text') || desc.includes('click here'))) {
    return {
      title: 'Use descriptive link text',
      description: 'Link text should describe the destination. Avoid generic text like "click here" or "read more".',
      code: `<!-- Before -->\n<a href="/pricing">Click here</a>\n\n<!-- After -->\n<a href="/pricing">View subscription plans</a>`,
      language: 'html',
    };
  }

  // Player controls
  if (clauseId.startsWith('7') && (desc.includes('control') || desc.includes('player'))) {
    return {
      title: 'Make player controls accessible',
      description: 'Video player controls must be keyboard-operable, have visible focus indicators, and include ARIA labels.',
      code: `<div role="toolbar" aria-label="Video controls">\n  <button aria-label="Play" tabindex="0">\n    <svg>...</svg>\n  </button>\n  <input type="range" role="slider"\n    aria-label="Volume"\n    aria-valuemin="0" aria-valuemax="100"\n    aria-valuenow="80">\n  </input>\n</div>`,
      language: 'html',
    };
  }

  return null;
}

export function FixSuggestion({ finding, clauseId }: FixSuggestionProps) {
  const [copied, setCopied] = useState(false);
  const suggestion = getSuggestion(finding, clauseId);

  if (!suggestion) return null;

  function handleCopy() {
    if (suggestion?.code) {
      navigator.clipboard.writeText(suggestion.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
          Quick Fix: {suggestion.title}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        {suggestion.description}
      </p>
      {suggestion.code && (
        <div className="relative">
          <pre className="bg-slate-900/80 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto font-mono border border-slate-800">
            <code>{suggestion.code}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 rounded-md bg-slate-700/80 px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-slate-600 transition-colors"
            aria-label="Copy code"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
