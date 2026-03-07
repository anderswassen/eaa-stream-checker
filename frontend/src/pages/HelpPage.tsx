import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function HelpPage() {
  return (
    <main id="main-content" className="flex-1 px-4 py-12">
      <motion.div
        className="max-w-3xl mx-auto space-y-10"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Back link */}
        <motion.div variants={fadeUp}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 rounded"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to scan
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div variants={fadeUp} className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Help &amp; Regulatory Context
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Understanding the European Accessibility Act and how EAA Stream Checker assists your compliance efforts.
          </p>
        </motion.div>

        {/* The Regulation */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            The European Accessibility Act
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The <strong className="text-slate-700 dark:text-slate-300">European Accessibility Act (EAA)</strong>, formally
            Directive (EU) 2019/882, establishes binding accessibility requirements for products and
            services across the European Union. As of <strong className="text-slate-700 dark:text-slate-300">28 June 2025</strong>,
            all digital services covered by the Act — including audio-visual media services and streaming
            platforms — must comply with the harmonised European standard <strong className="text-slate-700 dark:text-slate-300">EN 301 549</strong>.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Non-compliance carries significant legal and financial risk. Member States are required to
            establish market surveillance authorities empowered to impose penalties, order corrective
            measures, and in serious cases restrict or withdraw non-compliant services from the market.
            The penalties must be "effective, proportionate and dissuasive" — and they are set at the
            national level, meaning enforcement severity will vary across jurisdictions.
          </p>
        </motion.section>

        {/* What EN 301 549 requires */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            What EN 301 549 Requires for Streaming Services
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            EN 301 549 maps directly to WCAG 2.1 Level AA for web content, but extends well beyond it
            for media services. The standard imposes specific requirements across two key areas:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-bold font-mono text-xs">7</span>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Clause 7 — Video &amp; Streaming</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 ml-9 list-disc">
                <li>Captions (subtitles) for pre-recorded and live content</li>
                <li>Caption synchronization and quality analysis</li>
                <li>Audio description for visual information</li>
                <li>Accessible video player controls (ARIA, focus, contrast, touch targets)</li>
                <li>Keyboard operability of all player functions</li>
                <li>User control over caption presentation</li>
                <li>DRM that doesn't block accessibility features</li>
                <li>Iframe player accessibility</li>
                <li>Adaptive bitrate accessibility across quality levels</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold font-mono text-xs">9</span>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Clause 9 — Web Content</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 ml-9 list-disc">
                <li>WCAG 2.1 Level AA conformance</li>
                <li>Perceivable: text alternatives, colour contrast, resizable text</li>
                <li>Operable: keyboard navigation, focus management</li>
                <li>Understandable: consistent navigation, error identification</li>
                <li>Robust: valid markup, ARIA, assistive technology support</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Traditional compliance audits against EN 301 549 are comprehensive but resource-intensive,
            typically requiring weeks of specialist time and significant consultancy fees. For
            organisations managing multiple streaming properties, the cost and complexity multiply accordingly.
          </p>
        </motion.section>

        {/* How EAA Stream Checker helps */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            How EAA Stream Checker Helps
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            EAA Stream Checker automates the most time-consuming aspects of EN 301 549 compliance
            assessment for streaming services. In seconds rather than weeks, it provides:
          </p>
          <ul className="space-y-3 pt-1">
            {[
              {
                title: 'Automated WCAG 2.1 AA audit',
                desc: 'Runs a comprehensive axe-core analysis against your web content, mapping every finding directly to the relevant EN 301 549 clauses. Issues that would take days to identify manually are surfaced instantly.',
              },
              {
                title: 'Streaming player analysis',
                desc: 'Inspects your video player for caption support, audio description tracks, keyboard accessibility, and player control compliance — requirements specific to Clause 7 that generic accessibility tools typically miss entirely.',
              },
              {
                title: 'Caption quality analysis',
                desc: 'Downloads and parses WebVTT, SRT, and TTML caption files to validate timestamp sequencing, detect overlapping or empty cues, check for excessive gaps, and assess synchronization quality.',
              },
              {
                title: 'Player control accessibility',
                desc: 'Checks that all player controls have ARIA labels for screen readers, visible focus indicators for keyboard users, sufficient color contrast (WCAG 1.4.11), and minimum touch target sizes (WCAG 2.5.8).',
              },
              {
                title: 'DRM & playback restrictions check',
                desc: 'Detects Encrypted Media Extensions (EME) usage and DRM systems (Widevine, FairPlay, PlayReady). Verifies that captions are delivered outside the DRM envelope so accessibility features remain functional.',
              },
              {
                title: 'Live stream vs VOD detection',
                desc: 'Analyzes HLS/DASH manifests and page indicators to determine if content is live or on-demand. For live streams, verifies that real-time captioning is provided (with appropriate delay tolerance).',
              },
              {
                title: 'Iframe player accessibility',
                desc: 'Checks embedded player iframes for title attributes, fullscreen permissions, and sandbox restrictions that could block keyboard interaction or accessibility features.',
              },
              {
                title: 'Adaptive bitrate quality check',
                desc: 'Verifies that captions and audio descriptions remain available at all quality levels, including the lowest bitrate, ensuring users on slow connections still have access to accessibility features.',
              },
              {
                title: 'Manifest inspection',
                desc: 'HLS and DASH manifests are parsed to verify the presence of subtitle tracks, alternative audio tracks, and audio description at the source level, before they even reach the player.',
              },
              {
                title: 'Multi-language audio track analysis',
                desc: 'Identifies all available audio tracks and languages, checks audio description coverage per language, and flags languages that have main audio but lack corresponding audio description.',
              },
              {
                title: 'EN 301 549 clause mapping with help text',
                desc: 'Every finding is mapped to its corresponding EN 301 549 clause with plain-language explanations. Each clause includes help text explaining what it means and why it matters — the format auditors and legal teams expect.',
              },
              {
                title: 'Exportable compliance reports (PDF, JSON, VPAT)',
                desc: 'Reports can be exported as PDF for documentation, JSON for integration with internal systems, or as a VPAT 2.5 EU Edition — the industry-standard Accessibility Conformance Report format used for procurement and regulatory submissions.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Clause 7 checks detail */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Clause 7 Checks Performed
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The tool evaluates 15 specific EN 301 549 Clause 7 requirements automatically:
          </p>
          <div className="space-y-2 pt-2">
            {[
              { id: '7.1.1', title: 'Captioning playback', desc: 'Verifies caption/subtitle tracks exist in DOM, manifests, and player API.' },
              { id: '7.1.2', title: 'Captioning synchronization', desc: 'Downloads and analyzes caption files for timestamp issues, overlaps, and gaps.' },
              { id: '7.1.3', title: 'Preservation of captioning', desc: 'Checks that captions are present in streaming manifests (not just sidecar).' },
              { id: '7.1.4', title: 'Captioning characteristics', desc: 'Looks for caption customization controls (font size, color, background, position).' },
              { id: '7.1.5', title: 'Live caption delivery', desc: 'For live streams, verifies real-time captions are provided.' },
              { id: '7.2.1', title: 'Audio description playback', desc: 'Detects AD tracks in DOM, manifests, and player UI selectors.' },
              { id: '7.2.2', title: 'Audio description synchronization', desc: 'Flags AD tracks for manual sync verification.' },
              { id: '7.2.3', title: 'Preservation of audio description', desc: 'Checks that AD tracks are in streaming manifests.' },
              { id: '7.3', title: 'User controls for captions and AD', desc: 'Verifies keyboard access to caption/AD toggles at the same level as play controls.' },
              { id: '7.4.1', title: 'Player controls: ARIA labels', desc: 'Checks all player buttons have accessible names for screen readers.' },
              { id: '7.4.2', title: 'Player controls: Focus indicators', desc: 'Verifies visible focus indicators on interactive controls.' },
              { id: '7.4.3', title: 'Player controls: Contrast', desc: 'Measures control contrast ratios against WCAG 1.4.11 (3:1 minimum).' },
              { id: '7.4.4', title: 'Player controls: Touch targets', desc: 'Checks minimum 24x24px touch target size per WCAG 2.5.8.' },
              { id: '7.5.1', title: 'DRM accessibility', desc: 'Verifies DRM does not prevent access to captions and accessibility features.' },
              { id: '7.5.2', title: 'Iframe player accessibility', desc: 'Checks embedded player iframes for title, fullscreen, and sandbox issues.' },
              { id: '7.5.3', title: 'Adaptive bitrate accessibility', desc: 'Verifies accessibility features at all streaming quality levels.' },
            ].map((clause) => (
              <div key={clause.id} className="flex gap-3 items-start rounded-lg bg-slate-100/30 dark:bg-slate-800/30 px-3 py-2">
                <span className="text-xs font-mono font-bold text-brand-400 shrink-0 w-10 pt-0.5">{clause.id}</span>
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{clause.title}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{clause.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Important note */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4 border-l-2 border-yellow-500/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Important Limitations
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            EAA Stream Checker is a powerful screening tool, but it does not replace a full
            accessibility audit. Automated testing can identify a substantial portion of
            EN 301 549 violations — but certain requirements, particularly those involving
            subjective quality assessment (e.g., the adequacy of audio descriptions, the accuracy
            of captions, or the cognitive clarity of navigation structures) require expert human review.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            The tool is designed to dramatically reduce the time and cost of the initial compliance
            assessment, flag the most critical issues early, and provide ongoing monitoring as your
            service evolves. It is best used as the first step in a compliance process, complemented
            by targeted manual testing where the report indicates areas that need further review.
          </p>
        </motion.section>

        {/* How to use */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            How to Use
          </h2>
          <ol className="space-y-3 pt-1">
            {[
              { step: '1', text: 'Enter the URL of your streaming service on the home page and press "Check Compliance".' },
              { step: '2', text: 'Optionally enable "Deep scan" to crawl internal pages for a broader assessment.' },
              { step: '3', text: 'The tool loads your site in a headless browser, runs WCAG 2.1 AA checks, analyses the video player, streaming manifests, captions, DRM, and embedded iframes.' },
              { step: '4', text: 'Review the compliance report. Each finding is categorised by EN 301 549 clause, severity, and status (pass, fail, or needs review). Hover or expand clauses to see plain-language help text.' },
              { step: '5', text: 'Export as PDF for documentation, JSON for internal systems, or VPAT 2.5 EU Edition for procurement and regulatory submissions.' },
              { step: '6', text: 'Address the identified issues and re-scan to verify remediation.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold font-mono">
                  {item.step}
                </span>
                <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Key dates */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Key Regulatory Dates
          </h2>
          <div className="space-y-3 pt-1">
            {[
              { date: '28 June 2022', event: 'Member States were required to transpose the EAA into national law.' },
              { date: '28 June 2025', event: 'Compliance deadline. All covered products and services must meet EAA requirements.' },
              { date: '28 June 2030', event: 'End of transitional provisions for services already in use before the 2025 deadline.' },
            ].map((item) => (
              <div key={item.date} className="flex gap-4 items-baseline">
                <span className="text-sm font-mono font-bold text-cyan-400 shrink-0 w-32">{item.date}</span>
                <p className="text-sm text-slate-400">{item.event}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div variants={fadeUp} className="text-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-8 py-3 text-sm font-bold text-white hover:from-brand-500 hover:to-cyan-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all shadow-lg shadow-brand-500/20"
          >
            Start a Compliance Scan
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
