export interface GuideSection {
  heading: string;
  content: string;
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: GuideSection[];
  relatedSlugs: string[];
}

export const guides: Guide[] = [
  {
    slug: 'eaa-streaming-compliance',
    title: 'EAA Compliance for Streaming Services: The Complete Guide',
    metaTitle: 'EAA Compliance for Streaming Services — Complete 2026 Guide',
    metaDescription: 'Complete guide to European Accessibility Act compliance for streaming platforms. Learn what the EAA requires for video services, EN 301 549 Clause 7 obligations, enforcement timelines, and how to audit your streaming platform.',
    intro: 'The European Accessibility Act (EAA) has fundamentally changed the compliance landscape for streaming services across Europe. Since the enforcement deadline of 28 June 2025, every streaming platform, OTT service, and video-on-demand provider serving EU customers must meet the accessibility requirements defined in EN 301 549. This guide explains exactly what the EAA means for streaming services, what you need to do, and how to verify compliance.',
    sections: [
      {
        heading: 'What Is the European Accessibility Act?',
        content: `The European Accessibility Act (Directive 2019/882) is EU legislation that establishes binding accessibility requirements for products and services. It was adopted in 2019 and member states were required to transpose it into national law by 28 June 2022. The compliance deadline for services — including streaming platforms — was 28 June 2025.

The EAA covers a wide range of digital services, but its impact on streaming services is particularly significant. The Act explicitly includes "services providing access to audiovisual media services" in its scope. This means any platform that streams video content to EU consumers — whether subscription VOD, free ad-supported streaming, live event streaming, or catch-up TV — must comply.

Unlike the Web Content Accessibility Guidelines (WCAG) alone, the EAA requires compliance with the full EN 301 549 standard, which goes well beyond web content accessibility to include specific requirements for video playback, captions, audio description, and player controls.`
      },
      {
        heading: 'Who Must Comply?',
        content: `The EAA applies to any economic operator providing services to consumers in the EU. For streaming, this includes:

- **Subscription VOD platforms** (Netflix, Disney+, regional services)
- **Free ad-supported streaming** (FAST channels, catch-up TV)
- **Live event streaming** (sports, concerts, news)
- **Educational video platforms** serving EU users
- **Corporate video portals** with external-facing content
- **OTT aggregators** and smart TV app stores

The key factor is whether the service is available to EU consumers. Even platforms headquartered outside Europe must comply if they serve EU markets. Microenterprises (fewer than 10 employees and turnover under €2 million) are exempt, but most streaming services exceed these thresholds.`
      },
      {
        heading: 'EN 301 549: The Technical Standard',
        content: `EN 301 549 is the harmonised European standard for ICT accessibility. When the EAA says services must be "accessible," EN 301 549 defines exactly what that means in technical terms. For streaming services, two sections are critical:

**Clause 7 — ICT with Video Capabilities**: This clause covers everything specific to video playback. It requires caption support (7.1.1), caption synchronization (7.1.2), audio description (7.2.1), user controls for captions and audio description (7.3), and accessible player controls (7.4). These requirements go far beyond what a standard WCAG audit covers.

**Clause 9 — Web Content**: This clause maps directly to WCAG 2.2 Level AA. It covers all the standard web accessibility requirements: text alternatives, colour contrast, keyboard navigation, focus management, ARIA markup, and more. Every page of your streaming service — not just the video player — must meet these criteria.

The combination of Clause 7 and Clause 9 means streaming services face a dual compliance burden that most generic accessibility tools don't fully address.`
      },
      {
        heading: 'Clause 7 Requirements in Detail',
        content: `Clause 7 of EN 301 549 establishes requirements that are specific to video and media services. Here are the key obligations:

**Captions (7.1.1–7.1.5)**: All pre-recorded video content must have synchronised captions. Captions must be preserved through transmission (not stripped by encoding). Users must be able to customise caption appearance (font, size, colour, background). Live content requires real-time captioning.

**Audio Description (7.2.1–7.2.3)**: Pre-recorded video must provide audio description — a narrated track describing important visual information for blind and low-vision users. Audio description must be synchronised with the video and preserved through the delivery chain.

**Sign Language (7.1.6)**: Where sign language content is available, the platform must support its display. This may include picture-in-picture sign language interpreters or dedicated sign language video tracks.

**User Controls (7.3)**: Users must have the ability to activate, deactivate, and adjust captions, audio description, and spoken subtitles. These controls must be at the same level of interaction as primary media controls (play, pause, volume).

**Player Controls (7.4)**: All player interface elements must be accessible. This means ARIA labels for screen readers, visible focus indicators for keyboard users, sufficient colour contrast (3:1 minimum per WCAG 1.4.11), and minimum touch target sizes.

**DRM Compatibility (7.5)**: Digital Rights Management must not prevent access to accessibility features. Captions and audio description must remain functional regardless of content protection.`
      },
      {
        heading: 'How to Audit Your Streaming Platform',
        content: `A comprehensive EAA compliance audit for streaming involves several layers:

1. **Web content audit**: Run a WCAG 2.2 AA audit on all pages — home, browse, search, account, player pages. Check every page a user might visit, not just the landing page.

2. **Video player audit**: Test the player interface for keyboard operability, screen reader compatibility, focus management, and control contrast. Test with multiple assistive technologies.

3. **Manifest inspection**: Check HLS and DASH manifests for subtitle tracks, audio description tracks, and alternative audio. Verify that these tracks are properly signalled in the manifest metadata.

4. **Caption verification**: Download and parse caption files (WebVTT, SRT, TTML). Check for timestamp accuracy, synchronisation, overlapping cues, empty cues, and adequate coverage.

5. **DRM testing**: Verify that captions and accessibility features work with DRM-protected content. Test across different DRM systems (Widevine, FairPlay, PlayReady).

6. **Cross-device testing**: The EAA applies across all platforms. Test web, mobile web, native apps, and smart TV apps separately.

EAA Stream Checker automates steps 1–5 for your web-based player. Paste a URL and get a full EN 301 549 compliance report in 30 seconds — covering both Clause 7 (video) and Clause 9 (web content) requirements.`
      },
      {
        heading: 'Enforcement and Penalties',
        content: `The EAA requires member states to establish market surveillance authorities and define penalties that are "effective, proportionate, and dissuasive." Penalties vary significantly by country:

- **Germany**: Fines up to €100,000 per violation
- **France**: Fines up to €50,000, rising to €100,000 for repeat offences
- **Italy**: Fines from €5,000 to €40,000
- **Spain**: Fines up to €1,000,000 for very serious violations
- **Netherlands**: Administrative fines and potential service restrictions

Beyond fines, authorities can order corrective measures, require accessibility statements, and in serious cases restrict or withdraw non-compliant services from the market. Consumer organisations can also file collective complaints.

Enforcement is ramping up throughout 2026 as national authorities establish their processes and begin responding to complaints. The transition period for services that were already in use before June 2025 extends to June 2030, but new services and significant updates must comply immediately.`
      },
      {
        heading: 'Getting Started with Compliance',
        content: `If you're starting your EAA compliance journey for a streaming service, here's a practical roadmap:

1. **Baseline audit**: Use EAA Stream Checker to scan your main streaming URL and get an instant compliance score with EN 301 549 clause mapping.

2. **Prioritise critical issues**: Focus first on Clause 7 caption and audio description requirements, and Clause 9 keyboard accessibility. These affect the largest number of users.

3. **Fix web content issues**: Address WCAG 2.2 AA violations identified in the report. Most are straightforward CSS and HTML fixes.

4. **Add missing media features**: If captions or audio description are missing from manifests, work with your encoding pipeline to add them.

5. **Test player accessibility**: Ensure your video player passes keyboard navigation, ARIA labelling, and focus indicator requirements.

6. **Monitor continuously**: Set up regular rescans to catch regressions as your service evolves. EAA compliance is not a one-time effort.

7. **Document compliance**: Export VPAT 2.5 EU Edition reports for regulatory submissions and procurement requirements.`
      }
    ],
    relatedSlugs: ['en-301-549-streaming', 'eaa-fines', 'subtitles-captions-eaa']
  },

  {
    slug: 'en-301-549-streaming',
    title: 'EN 301 549 for Streaming Media: Technical Requirements',
    metaTitle: 'EN 301 549 Streaming Requirements — Clause 7 & 9 Explained',
    metaDescription: 'Technical deep-dive into EN 301 549 requirements for streaming services. Clause 7 video accessibility, Clause 9 web content, HLS/DASH manifest requirements, and automated compliance testing.',
    intro: 'EN 301 549 is the European harmonised standard that defines the technical accessibility requirements for ICT products and services. For streaming media, it imposes specific obligations across two key clauses: Clause 7 for video capabilities and Clause 9 for web content. This guide breaks down every relevant requirement and explains how to test for compliance.',
    sections: [
      {
        heading: 'Understanding EN 301 549',
        content: `EN 301 549 (full title: "Accessibility requirements for ICT products and services") is maintained by ETSI, CEN, and CENELEC. It serves as the presumption-of-conformity standard for the European Accessibility Act — meaning that if your service meets EN 301 549, you are presumed to comply with the EAA's accessibility requirements.

The standard is extensive, covering everything from hardware to software to web content to documentation. For streaming services, the relevant sections are Clause 7 (ICT with video capabilities), Clause 9 (Web), Clause 10 (Non-web documents, if applicable), and Clause 11 (Software, for native apps).

EN 301 549 Clause 9 maps directly to WCAG 2.2 Level AA success criteria, using the same numbering. Clause 9.1.1.1 corresponds to WCAG 1.1.1 (Non-text Content), Clause 9.2.4.7 corresponds to WCAG 2.4.7 (Focus Visible), and so on. This mapping makes it straightforward to use existing WCAG testing tools for Clause 9 compliance.

Clause 7, however, has no WCAG equivalent. These requirements are unique to media services and require specialised testing that most accessibility tools don't provide.`
      },
      {
        heading: 'Clause 7: Video Capabilities — Full Breakdown',
        content: `**7.1 — Caption Processing Technology**

7.1.1 (Captioning Playback): The player must be able to display captions when they are provided. This means the player must support at least one caption format (WebVTT, SRT, TTML) and have a mechanism to enable/disable caption display.

7.1.2 (Captioning Synchronisation): Captions must be synchronised with the audio within acceptable tolerances. For pre-recorded content, captions should be within 100ms of the corresponding audio. Automated testing can verify timestamp sequencing and detect drift.

7.1.3 (Preservation of Captioning): Captions must not be stripped or lost during transmission. If content has captions at the source, they must be available to the end user. This is particularly relevant for transcoding and CDN delivery chains.

7.1.4 (Captioning Characteristics): Users must be able to customise caption presentation — at minimum, font size and foreground/background colours. This ensures captions are readable for users with different visual needs.

7.1.5 (Spoken Subtitles / Live Captions): For live content, real-time captions must be provided. This typically requires integration with live captioning services (human captioners or ASR-based solutions).

**7.2 — Audio Description Technology**

7.2.1 (Audio Description Playback): The player must support audio description tracks. When available, users must be able to select and hear audio description synchronised with the video.

7.2.2 (Audio Description Synchronisation): Audio description must be properly timed with the visual content it describes.

7.2.3 (Preservation of Audio Description): Like captions, audio description tracks must survive the delivery chain and remain available to users.

**7.3 — User Controls for Captions and Audio Description**

Controls for captions and audio description must be at the same level as primary playback controls. Users should not need to navigate through deep menus to find accessibility features — they should be as prominent and accessible as play, pause, and volume.

**7.4 — Player Controls Accessibility**

All player controls must meet accessibility standards: proper ARIA labelling (7.4.1), visible focus indicators (7.4.2), sufficient colour contrast (7.4.3), and adequate touch target sizes (7.4.4).`
      },
      {
        heading: 'Clause 9: Web Content (WCAG 2.2 AA)',
        content: `Clause 9 requires all web content to meet WCAG 2.2 Level AA. For streaming services, this applies to every page: the homepage, browse/search interfaces, account management, subscription flows, and the video player page itself. Key areas include:

**Perceivable (1.x)**: All non-text content needs text alternatives. Colour cannot be the sole means of conveying information. Text must have 4.5:1 contrast ratio. Content must reflow at 320px width without horizontal scrolling.

**Operable (2.x)**: Everything must work with keyboard alone. No keyboard traps. Time limits must be adjustable. Focus order must be logical. Focus indicators must be visible.

**Understandable (3.x)**: Page language must be declared. Navigation must be consistent. Form errors must be clearly identified with suggestions for correction.

**Robust (4.x)**: Content must be compatible with assistive technologies. All interactive elements must expose their name, role, and state through standard markup and ARIA.

Automated tools can reliably detect approximately 30-40% of WCAG violations. For streaming services, the most common issues are missing alt text on promotional images, insufficient contrast on UI elements, missing form labels, keyboard traps in custom player controls, and missing language declarations.`
      },
      {
        heading: 'HLS and DASH Manifest Requirements',
        content: `Streaming manifests (HLS .m3u8 and DASH .mpd) are where accessibility features are declared at the delivery level. Proper manifest configuration ensures that captions and audio description reach the player.

**HLS Requirements**: Subtitle tracks should be declared as #EXT-X-MEDIA with TYPE=SUBTITLES. Audio description should be declared as #EXT-X-MEDIA with TYPE=AUDIO and CHARACTERISTICS=public.accessibility.describes-video. The DEFAULT and AUTOSELECT attributes control default selection behaviour.

**DASH Requirements**: In MPD files, subtitle tracks should be declared in AdaptationSets with role values indicating their purpose. Audio description is typically signalled with the accessibility descriptor using the urn:tva:metadata:cs:AudioPurposeCS scheme with value "1" (visually impaired) or "2" (audio description).

**Common Issues**: Caption tracks present in the source but missing from manifests (encoding pipeline strips them). Audio description tracks with incorrect language tags. Missing CHARACTERISTICS attributes that prevent assistive technology from identifying accessibility tracks.

EAA Stream Checker intercepts HLS and DASH manifests during scanning and parses them to verify the presence and correct signalling of subtitle and audio description tracks.`
      },
      {
        heading: 'Testing EN 301 549 Compliance',
        content: `Testing EN 301 549 for streaming services requires a combination of automated and manual methods:

**Automated testing (what EAA Stream Checker does)**:
- WCAG 2.2 AA audit using axe-core (covers all of Clause 9)
- Video player detection and control accessibility testing
- HLS/DASH manifest interception and parsing
- Caption file download and quality analysis
- Audio description track detection
- DRM accessibility verification
- Player SDK known issue flagging
- EN 301 549 clause mapping for all findings

**Manual testing (still required)**:
- Caption content accuracy and quality assessment
- Audio description adequacy and timing
- Cognitive accessibility of navigation flows
- Multi-device testing (native apps, smart TVs)
- User testing with assistive technology users

The recommended approach is to use automated testing as a baseline screening tool — catching the majority of issues quickly and cheaply — then focus manual testing effort on the areas that automation cannot fully assess.`
      }
    ],
    relatedSlugs: ['eaa-streaming-compliance', 'hls-accessibility', 'audio-description-eaa']
  },

  {
    slug: 'hls-accessibility',
    title: 'HLS Accessibility: Making HTTP Live Streaming Compliant',
    metaTitle: 'HLS Accessibility Compliance — Captions, Audio Description & EN 301 549',
    metaDescription: 'How to make HLS streams accessible and EAA compliant. Configure subtitle tracks, audio description, manifest signalling, and adaptive bitrate accessibility for EN 301 549 compliance.',
    intro: 'HTTP Live Streaming (HLS) is the dominant streaming protocol, used by most major platforms and CDNs. Making your HLS streams accessible and compliant with EN 301 549 requires specific configuration at the manifest, encoding, and player levels. This guide covers everything you need to know about HLS accessibility.',
    sections: [
      {
        heading: 'HLS and Accessibility: The Basics',
        content: `HLS delivers video content as a series of small segments described by playlist files (.m3u8). The master playlist lists available quality levels, audio tracks, and subtitle tracks. For accessibility compliance, the manifest must properly declare caption and audio description tracks so players can offer them to users.

The HLS specification supports several accessibility-related features:
- **Subtitle/Caption tracks** via #EXT-X-MEDIA with TYPE=SUBTITLES
- **Audio description tracks** via #EXT-X-MEDIA with TYPE=AUDIO and accessibility CHARACTERISTICS
- **Forced subtitles** for foreign language dialogue via the FORCED=YES attribute
- **SDH (Subtitles for the Deaf and Hard of Hearing)** via the CHARACTERISTICS attribute

Many streaming services deliver video with HLS but fail to properly configure these accessibility features in their manifests. The content may exist on the origin server but never reach the player because the manifest doesn't declare it.`
      },
      {
        heading: 'Configuring Subtitle Tracks in HLS',
        content: `Subtitles and captions in HLS are declared using the #EXT-X-MEDIA tag with TYPE=SUBTITLES. A properly configured subtitle track looks like this:

#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",LANGUAGE="en",NAME="English",DEFAULT=YES,AUTOSELECT=YES,FORCED=NO,URI="subtitles/en/playlist.m3u8"

Key attributes for compliance:
- **LANGUAGE**: Must be a valid BCP 47 language tag. This allows players and assistive technologies to present the correct language label.
- **NAME**: A human-readable label shown in the player UI.
- **DEFAULT**: Set to YES for the primary subtitle track so it's available without user action.
- **AUTOSELECT**: Set to YES so the player can automatically select based on user language preferences.
- **CHARACTERISTICS**: For SDH captions (which include sound effects and speaker identification), add CHARACTERISTICS="public.accessibility.transcribes-spoken-dialog,public.accessibility.describes-music-and-sound".

Caption file formats: HLS supports WebVTT natively. WebVTT files should be segmented (split into small chunks matching the video segment duration) for live streaming, or served as a single file for VOD. TTML/IMSC can also be used with appropriate packaging.`
      },
      {
        heading: 'Audio Description in HLS',
        content: `Audio description in HLS is delivered as a separate audio track in the manifest. The track should be clearly identified so players and assistive technologies can find it:

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="en",NAME="English (Audio Description)",DEFAULT=NO,AUTOSELECT=NO,CHARACTERISTICS="public.accessibility.describes-video",URI="audio/en-ad/playlist.m3u8"

Critical configuration points:
- **CHARACTERISTICS="public.accessibility.describes-video"**: This is the key attribute. Without it, the audio description track is indistinguishable from a regular alternative audio track. Assistive technologies and accessibility-aware players use this attribute to identify audio description.
- **NAME**: Should clearly indicate this is an audio description track.
- **DEFAULT=NO**: Audio description should not be the default audio (it would be confusing for users who don't need it), but it should be easily discoverable.
- **LANGUAGE**: Must match the language of the described audio. If you have main audio in English and French, ideally provide audio description for both.

Common mistakes: Providing audio description as a separate stream URL rather than an alternative audio track in the same manifest. This breaks player UI integration and makes the track harder to discover.`
      },
      {
        heading: 'Adaptive Bitrate and Accessibility',
        content: `HLS adaptive bitrate (ABR) streaming delivers multiple quality levels. A critical EN 301 549 requirement is that accessibility features remain available at all quality levels, including the lowest bitrate.

**Common compliance failure**: Subtitle and audio description tracks are configured for higher quality variants but missing from lower bitrate variants. When a user on a slow connection drops to a lower quality level, they lose accessibility features.

To verify compliance:
1. Check that every variant in the master playlist references the same subtitle group
2. Verify audio description tracks are available across all quality levels
3. Test playback at the lowest quality level to confirm captions and audio description work

In your HLS master playlist, each #EXT-X-STREAM-INF should reference the subtitle group:

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,SUBTITLES="subs",AUDIO="audio"
video/360p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2400000,RESOLUTION=1280x720,SUBTITLES="subs",AUDIO="audio"
video/720p/playlist.m3u8

Both variants reference the same "subs" and "audio" groups, ensuring accessibility features are consistent.`
      },
      {
        heading: 'Testing HLS Accessibility',
        content: `EAA Stream Checker intercepts HLS manifests during page scanning and analyses them for accessibility compliance. The automated checks include:

- **Subtitle track detection**: Verifies #EXT-X-MEDIA tags with TYPE=SUBTITLES exist
- **Audio description detection**: Checks for CHARACTERISTICS="public.accessibility.describes-video" on audio tracks
- **Cross-quality verification**: Confirms subtitle and audio groups are referenced across all quality variants
- **Caption file analysis**: Downloads and parses WebVTT/SRT files to check timestamp quality
- **Language coverage**: Reports all available subtitle and audio languages

To test your HLS streams, paste your streaming service URL into EAA Stream Checker. The tool loads the page in a real browser, intercepts network requests to find HLS manifests, and analyses them for EN 301 549 compliance.

For manual verification, you can also inspect manifests directly:
1. Open your streaming page in a browser
2. Open Developer Tools → Network tab
3. Filter for .m3u8 files
4. Inspect the master playlist for subtitle and audio track declarations
5. Verify CHARACTERISTICS attributes are present`
      }
    ],
    relatedSlugs: ['en-301-549-streaming', 'subtitles-captions-eaa', 'audio-description-eaa']
  },

  {
    slug: 'eaa-fines',
    title: 'EAA Fines and Penalties: What Non-Compliance Costs',
    metaTitle: 'EAA Fines & Penalties by Country — European Accessibility Act Enforcement 2026',
    metaDescription: 'European Accessibility Act fines and penalties by EU member state. Learn what non-compliance costs for streaming services, enforcement timelines, and how to avoid penalties with compliance auditing.',
    intro: 'The European Accessibility Act requires member states to establish "effective, proportionate, and dissuasive" penalties for non-compliance. With the enforcement deadline passed in June 2025, market surveillance authorities across Europe are now actively processing complaints and conducting inspections. This guide details the penalty frameworks across major EU markets.',
    sections: [
      {
        heading: 'How EAA Enforcement Works',
        content: `The EAA establishes a decentralised enforcement model. Each EU member state is responsible for:

1. **Transposing** the directive into national law (deadline: June 2022)
2. **Designating** market surveillance authorities
3. **Defining** penalties that are "effective, proportionate, and dissuasive"
4. **Enforcing** compliance through inspections, complaints, and penalties

This means enforcement severity, fine amounts, and procedures vary by country. A streaming service operating across Europe may face different penalty regimes in different markets.

Market surveillance authorities can act on their own initiative or in response to complaints. Consumer organisations, disability rights groups, and individual users can all file complaints. Authorities have the power to:

- Order corrective measures within a specified deadline
- Impose administrative fines
- Restrict or withdraw non-compliant services from the market
- Require public accessibility statements
- Mandate third-party accessibility audits`
      },
      {
        heading: 'Penalties by Country',
        content: `**Germany** (BFSG — Barrierefreiheitsstärkungsgesetz)
Market surveillance: Bundesnetzagentur
Fines: Up to €100,000 per violation. Repeated violations or failure to comply with corrective orders can result in higher penalties. Germany's enforcement has been among the most active in the EU.

**France** (Loi n° 2023-171)
Authority: ARCOM (for audiovisual services)
Fines: Up to €50,000 per violation, rising to €100,000 for repeat offences. France additionally requires accessibility statements and action plans, with separate penalties for failure to publish these.

**Italy** (Decreto Legislativo)
Authority: AgID
Fines: €5,000 to €40,000 per violation. Italy has a structured escalation approach — initial warnings, then corrective orders, then fines.

**Spain** (Real Decreto Legislativo)
Authority: Multiple (national + regional)
Fines: Up to €100,000 for serious violations, up to €1,000,000 for very serious violations. Spain has the highest maximum penalties in the EU.

**Netherlands** (Toegankelijkheidswet)
Authority: Dutch Authority for Consumers and Markets (ACM)
Fines: Administrative fines based on severity. The ACM can also issue binding instructions and periodic penalty payments.

**Sweden** (Tillgänglighetsdirektivet)
Authority: Swedish Consumer Agency (Konsumentverket)
Fines: Sanctions based on company revenue and violation severity.

**Poland** (Ustawa o dostępności)
Authority: President of the Office of Electronic Communications
Fines: Up to PLN 100,000 (approximately €23,000).

**Ireland** (European Union (Accessibility Requirements for Products and Services) Regulations)
Authority: Competition and Consumer Protection Commission (CCPC)
Fines: On conviction, fines up to €65,000 and/or imprisonment up to 18 months for responsible officers.`
      },
      {
        heading: 'Beyond Fines: Other Risks',
        content: `Financial penalties are only one dimension of the risk. Non-compliance with the EAA also creates:

**Reputational risk**: Accessibility complaints and enforcement actions can generate negative publicity. In an era of ESG reporting and corporate social responsibility, accessibility failures reflect poorly on an organisation.

**Procurement exclusion**: EU public procurement increasingly requires accessibility conformance evidence. Without a valid VPAT or accessibility conformance report, streaming services may be excluded from government and institutional contracts.

**Legal liability**: Beyond regulatory fines, individual users may bring civil claims for denial of access. Disability discrimination laws in many member states provide additional legal avenues.

**Market access restrictions**: In serious cases, authorities can restrict or withdraw non-compliant services from the market entirely. This is the nuclear option, but it exists in the legislation.

**Competitive disadvantage**: As awareness grows, consumers — particularly those with disabilities and their families — will increasingly choose accessible services. Accessibility is becoming a market differentiator.`
      },
      {
        heading: 'The Transition Period',
        content: `The EAA includes a transition period for services that were already in use before 28 June 2025. These services have until 28 June 2030 to achieve full compliance. However, this transition applies only to existing services — any new service launched after June 2025, or any significant update to an existing service, must comply immediately.

Key points about the transition:
- The transition applies to the service as it existed on 28 June 2025
- Significant updates, redesigns, or new feature launches must be accessible from day one
- The transition does not exempt services from responding to accessibility complaints
- Authorities can still investigate and order corrective measures during the transition
- Many member states interpret "significant update" broadly

In practice, most streaming services undergo frequent updates and redesigns, which means the transition period offers limited protection. The safest approach is to begin compliance efforts now rather than relying on the transition period.`
      },
      {
        heading: 'How to Protect Your Service',
        content: `The most cost-effective approach to avoiding EAA penalties is proactive compliance:

1. **Baseline assessment**: Use EAA Stream Checker to scan your streaming service and get an instant compliance score with EN 301 549 clause mapping.

2. **Remediation plan**: Address identified violations, prioritising critical issues (missing captions, keyboard traps, missing ARIA labels).

3. **Continuous monitoring**: Set up regular rescans to catch regressions. Streaming services change frequently — new deployments can introduce accessibility issues.

4. **Document compliance**: Export VPAT 2.5 EU Edition reports to demonstrate your compliance efforts. This documentation can be valuable evidence if a complaint is filed.

5. **Accessibility statement**: Publish an accessibility statement on your service describing your compliance status, known issues, and contact information for accessibility feedback.

6. **Staff training**: Ensure developers, designers, and content producers understand accessibility requirements. Prevention is always cheaper than remediation.

The cost of a compliance programme is a fraction of potential fines — let alone the reputational and legal costs of enforcement action. A single scan with EAA Stream Checker takes 30 seconds and provides a comprehensive starting point.`
      }
    ],
    relatedSlugs: ['eaa-streaming-compliance', 'en-301-549-streaming', 'subtitles-captions-eaa']
  },

  {
    slug: 'subtitles-captions-eaa',
    title: 'Subtitle and Caption Requirements Under the EAA',
    metaTitle: 'EAA Subtitle & Caption Requirements — EN 301 549 Compliance Guide',
    metaDescription: 'Complete guide to subtitle and caption requirements under the European Accessibility Act. EN 301 549 Clause 7.1 obligations, WebVTT/TTML standards, synchronisation, customisation, and automated testing.',
    intro: 'Captions and subtitles are the most visible accessibility feature of any streaming service — and the most commonly tested by enforcement authorities. The European Accessibility Act, through EN 301 549 Clause 7.1, establishes detailed requirements for caption provision, synchronisation, preservation, customisation, and live delivery. This guide covers everything streaming providers need to know.',
    sections: [
      {
        heading: 'Captions vs Subtitles: What the EAA Requires',
        content: `The terms "captions" and "subtitles" are often used interchangeably, but they serve different purposes. EN 301 549 uses the term "captions" to encompass both:

**Subtitles**: Text translation of spoken dialogue, intended for viewers who can hear but don't understand the spoken language. Typically available in multiple languages.

**Closed Captions (SDH)**: Subtitles for the Deaf and Hard of Hearing. These include not just dialogue but also sound effects ([door slams]), speaker identification, and music descriptions ([upbeat jazz]). SDH captions make the audio track accessible to users who cannot hear it.

The EAA requires both types where applicable. For content in the service's primary language, SDH captions are required to serve deaf and hard-of-hearing users. For multilingual services, translation subtitles serve users who speak different languages.

The key requirement is that captions must be provided for all pre-recorded content with audio. "All content" means not just main programming — it includes trailers, previews, bonus content, and any other video content on the platform.`
      },
      {
        heading: 'EN 301 549 Clause 7.1 Explained',
        content: `Clause 7.1 of EN 301 549 establishes five specific requirements for captions:

**7.1.1 — Captioning Playback**: The player must support caption display. This means the player needs a built-in caption rendering engine or support for external caption tracks. At minimum, the player must handle WebVTT format, which is the standard for web-based video.

**7.1.2 — Captioning Synchronisation**: Captions must be synchronised with the audio content. For pre-recorded content, this means timestamps must align with the spoken words within acceptable tolerances (generally within 100ms). Poor synchronisation — captions appearing too early or too late — undermines their usefulness.

**7.1.3 — Preservation of Captioning**: Captions must survive the content delivery chain. If captions exist at the source (in the origin server or CMS), they must be delivered to the end user. This is a common failure point: encoding pipelines, CDN configurations, or manifest generators may strip caption tracks during processing.

**7.1.4 — Captioning Characteristics**: Users must be able to customise caption presentation. At minimum: font size, foreground colour, background colour/opacity. Advanced customisation includes font family, text edge style, and window colour. This ensures captions are readable for users with different visual needs.

**7.1.5 — Spoken Subtitles / Live Captions**: Live content requires real-time captioning. This may use human captioners (highest quality), automated speech recognition (ASR), or a hybrid approach. The key requirement is that captions are available during the live broadcast, not just after the fact.`
      },
      {
        heading: 'Caption File Formats and Quality',
        content: `Several caption file formats are used in streaming. Each has strengths and limitations:

**WebVTT** (Web Video Text Tracks): The native format for HTML5 video and HLS streaming. Supports styling, positioning, and voice tags. The recommended format for web-based streaming.

**SRT** (SubRip Subtitle): The simplest and most widely supported format. Plain text with timestamps. No styling support. Often used as an interchange format.

**TTML/IMSC** (Timed Text Markup Language / Internet Media Subtitles and Captions): XML-based format with rich styling. Used in DASH streaming and broadcast workflows. IMSC is a constrained profile of TTML designed for internet delivery.

**CEA-608/708**: Legacy broadcast caption formats. Relevant for services that restream broadcast content.

**Caption quality metrics that EAA Stream Checker verifies**:
- Timestamp accuracy: No negative durations, no overlapping cues
- Sequence integrity: Cues in chronological order
- Coverage: No excessive gaps between cues (indicating missing captions)
- Content: No empty cues or cues with only whitespace
- Synchronisation: Timestamps align with expected audio timing`
      },
      {
        heading: 'Caption Customisation Requirements',
        content: `EN 301 549 clause 7.1.4 requires user control over caption presentation. This is about more than offering on/off toggle — users must be able to adjust how captions look.

**Minimum required customisation**:
- Font size (at least small/medium/large options)
- Text colour
- Background colour and/or opacity

**Recommended additional options**:
- Font family (serif, sans-serif, monospace, casual, cursive)
- Text edge style (none, raised, depressed, uniform, drop shadow)
- Window/background colour separate from text background
- Caption position (top/bottom)

Many video players support these natively (Video.js with caption settings, JW Player, Bitmovin). Custom players may need additional development to implement caption customisation controls.

The customisation UI itself must be accessible — keyboard operable, with proper ARIA labels, sufficient contrast, and logical focus order. This creates a recursive requirement: the controls for making captions accessible must themselves be accessible.`
      },
      {
        heading: 'Live Captioning',
        content: `Live streaming presents unique caption challenges. EN 301 549 clause 7.1.5 requires that live content with audio provides real-time captions. Options include:

**Human captioners (CART/stenographers)**: Highest accuracy (98%+). A trained professional transcribes speech in real-time. Best for news, live events, and content where accuracy is critical. Cost: higher per hour, but highest quality.

**Automatic Speech Recognition (ASR)**: AI-powered captioning. Accuracy varies (85-95% depending on provider and content). More affordable for high-volume live content. Improving rapidly with large language models.

**Hybrid approach**: ASR with human correction in real-time. Offers a balance of speed, accuracy, and cost. Becoming the standard for many live streaming services.

**Technical implementation**: Live captions are typically delivered as WebVTT segments synchronised with the live stream. In HLS, this means segmented WebVTT playlists that update as new caption segments become available. The latency between speech and caption display should be minimised — typically 2-5 seconds for human captioners, near-real-time for ASR.

EAA Stream Checker detects live streams (via manifest analysis and page indicators) and checks whether real-time caption tracks are being delivered.`
      },
      {
        heading: 'Testing Caption Compliance',
        content: `EAA Stream Checker automates caption compliance testing across multiple dimensions:

1. **Detection**: Finds caption tracks in the DOM, HLS/DASH manifests, and player APIs. Detects whether captions are present at all.

2. **Format verification**: Identifies the caption format (WebVTT, SRT, TTML) and checks for structural validity.

3. **Quality analysis**: Downloads caption files and analyses them for:
   - Timestamp issues (negative durations, overlaps)
   - Sequence errors (out-of-order cues)
   - Empty or whitespace-only cues
   - Excessive gaps suggesting missing content
   - Synchronisation quality

4. **Manifest verification**: Checks that caption tracks are declared in HLS/DASH manifests with proper attributes (LANGUAGE, NAME, CHARACTERISTICS).

5. **Customisation**: Checks for caption customisation controls in the player UI.

6. **Preservation**: Verifies captions are available across all quality levels in adaptive bitrate streams.

To test your captions, scan your streaming URL with EAA Stream Checker. The report will show exactly which EN 301 549 Clause 7.1 requirements pass, fail, or need manual review — with evidence and remediation guidance for each finding.`
      }
    ],
    relatedSlugs: ['eaa-streaming-compliance', 'hls-accessibility', 'audio-description-eaa']
  },

  {
    slug: 'audio-description-eaa',
    title: 'Audio Description Requirements Under the European Accessibility Act',
    metaTitle: 'Audio Description Requirements — EAA & EN 301 549 Compliance Guide',
    metaDescription: 'Guide to audio description requirements under the European Accessibility Act. EN 301 549 Clause 7.2 obligations, HLS/DASH implementation, testing tools, and compliance verification for streaming services.',
    intro: 'Audio description (AD) provides a narrated description of important visual information in video content, enabling blind and low-vision users to understand what is happening on screen. The European Accessibility Act, through EN 301 549 Clause 7.2, requires streaming services to support audio description. This guide explains the requirements, implementation options, and how to verify compliance.',
    sections: [
      {
        heading: 'What Is Audio Description?',
        content: `Audio description is an additional audio track that describes visual elements that are essential to understanding the content. It fills the gaps between dialogue with descriptions of:

- Actions and movements ("Sarah walks to the window and looks out at the storm")
- Scene changes ("Interior. Hospital room. Night.")
- On-screen text and graphics ("The subtitle reads: Three years later")
- Facial expressions and body language ("John's face falls as he reads the letter")
- Visual gags or plot-relevant details that aren't conveyed through dialogue

Audio description is distinct from subtitles/captions. While captions make the audio accessible to deaf and hard-of-hearing users, audio description makes the visual content accessible to blind and low-vision users. Together, they ensure the complete audiovisual experience is accessible.

According to the European Blind Union, approximately 30 million people in Europe are blind or have a visual impairment. Audio description is not a niche feature — it serves a significant and growing user base.`
      },
      {
        heading: 'EN 301 549 Clause 7.2 Requirements',
        content: `Clause 7.2 establishes three requirements for audio description:

**7.2.1 — Audio Description Playback**: The platform must support playback of audio description when it is provided with the content. This means the player must be able to select and play an alternative audio track that contains audio description.

This requirement is about player capability — the player must support AD tracks. If content has AD available, the user must be able to access it. The player needs a UI mechanism (typically an audio track selector or a dedicated AD toggle button) to let users enable audio description.

**7.2.2 — Audio Description Synchronisation**: The audio description must be synchronised with the video content. AD narration should align with the visual content it describes, fitting into natural pauses in dialogue.

For pre-recorded content, this means the AD track must be timed to match the video. For extended audio description (where the video pauses to allow longer descriptions), the player must support this playback mode if the content provides it.

**7.2.3 — Preservation of Audio Description**: Audio description tracks must be preserved through the content delivery chain. If AD is available at the source, it must be delivered to the end user.

This is the same principle as caption preservation (7.1.3). Encoding, transcoding, CDN delivery, and manifest generation must not strip or lose audio description tracks. This is a common compliance failure — AD tracks exist at the origin but are not included in the streaming manifest.`
      },
      {
        heading: 'Implementing Audio Description in Streaming',
        content: `There are several approaches to delivering audio description in streaming:

**Separate audio track (recommended)**: Create an alternative audio mix that includes both the original audio and the audio description narration. Deliver this as an additional audio track in the HLS/DASH manifest. The user selects this track in the player UI.

Advantages: Standard approach, widely supported by players, clear separation from main audio.
Implementation: Requires an additional audio encoding for each piece of content with AD.

**Audio description as a mix-minus**: Some implementations use a separate AD narration track that is mixed with the main audio on the client side. This allows the user to control the balance between main audio and description.

Advantages: More flexible, allows volume adjustment.
Disadvantages: More complex player implementation, not universally supported.

**Extended audio description**: For content where natural pauses in dialogue are insufficient for descriptions, the video can be paused while the description plays, then resumed. This is more common in educational and cultural content.

Advantages: Allows thorough descriptions.
Disadvantages: Disrupts viewing flow, requires specialised player support.

**HLS implementation**: Declare the AD audio track in the manifest with CHARACTERISTICS="public.accessibility.describes-video":

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="en",NAME="English (Audio Description)",CHARACTERISTICS="public.accessibility.describes-video",URI="audio/en-ad/playlist.m3u8"

**DASH implementation**: Use an Accessibility descriptor in the AD adaptation set:

<AdaptationSet lang="en" contentType="audio">
  <Accessibility schemeIdUri="urn:tva:metadata:cs:AudioPurposeCS:2007" value="1"/>
  <Representation id="ad-en" bandwidth="128000" />
</AdaptationSet>`
      },
      {
        heading: 'Content Creation and Prioritisation',
        content: `Creating audio description is a content production process that requires skilled writers and voice artists. For streaming services with large content libraries, describing every piece of content immediately may not be feasible. A practical prioritisation approach:

**Priority 1 — New original content**: All new content produced by or for the service should include audio description from launch. Building AD into the production workflow is far more cost-effective than retrofitting.

**Priority 2 — Most popular content**: The titles with the highest viewership numbers should be described first. This maximises the impact of your AD investment.

**Priority 3 — Content already described in other markets**: If a title has AD available in another language or territory, it may be possible to adapt or re-record rather than starting from scratch.

**Priority 4 — Catalogue backfill**: Systematically work through the remaining catalogue, prioritising by viewership and genre (scripted content typically benefits more from AD than talk shows or news).

The EAA does not specify a percentage of content that must have AD — it requires that the platform supports AD playback and that AD is provided where available. However, a good-faith effort to expand AD coverage demonstrates compliance commitment and reduces enforcement risk.`
      },
      {
        heading: 'Testing Audio Description Compliance',
        content: `EAA Stream Checker automates audio description compliance testing at the technical level:

**What the tool checks**:
- Presence of audio description tracks in the DOM (HTML5 audio track elements)
- AD tracks in HLS manifests (CHARACTERISTICS="public.accessibility.describes-video")
- AD tracks in DASH manifests (Accessibility descriptors with AudioPurposeCS)
- Player UI controls for selecting audio description
- AD availability across all adaptive bitrate quality levels
- Multi-language AD coverage (flags languages with main audio but no corresponding AD)

**What requires manual testing**:
- Quality and accuracy of the audio description narration
- Timing and synchronisation with visual content
- Adequacy of descriptions (are all important visual elements described?)
- Voice quality and clarity of the narration
- Consistency of description style across content

The automated checks verify the technical delivery infrastructure — that AD tracks exist, are properly signalled, and are accessible through the player. Manual review is needed to assess the quality and completeness of the descriptions themselves.

To test your service, paste your streaming URL into EAA Stream Checker. The EN 301 549 Clause 7.2 section of the report will show exactly what was detected, what's missing, and what needs manual review.`
      }
    ],
    relatedSlugs: ['eaa-streaming-compliance', 'subtitles-captions-eaa', 'en-301-549-streaming']
  }
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find(g => g.slug === slug);
}

export function getRelatedGuides(slugs: string[]): Guide[] {
  return slugs.map(s => guides.find(g => g.slug === s)).filter((g): g is Guide => !!g);
}
