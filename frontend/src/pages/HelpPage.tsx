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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white text-slate-900">
            Help &amp; Regulatory Context
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Understanding the European Accessibility Act and how EAA Stream Checker assists your compliance efforts.
          </p>
        </motion.div>

        {/* The Regulation */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-200 dark:text-slate-200 text-slate-800">
            The European Accessibility Act
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The <strong className="text-slate-300 dark:text-slate-300 text-slate-700">European Accessibility Act (EAA)</strong>, formally
            Directive (EU) 2019/882, establishes binding accessibility requirements for products and
            services across the European Union. As of <strong className="text-slate-300 dark:text-slate-300 text-slate-700">28 June 2025</strong>,
            all digital services covered by the Act — including audio-visual media services and streaming
            platforms — must comply with the harmonised European standard <strong className="text-slate-300 dark:text-slate-300 text-slate-700">EN 301 549</strong>.
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
          <h2 className="text-xl font-bold text-slate-200 dark:text-slate-200 text-slate-800">
            What EN 301 549 Requires for Streaming Services
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            EN 301 549 maps directly to WCAG 2.1 Level AA for web content, but extends well beyond it
            for media services. The standard imposes specific requirements across two key areas:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-bold font-mono text-xs">7</span>
                <h3 className="text-sm font-semibold text-slate-200 dark:text-slate-200 text-slate-800">Clause 7 — Video &amp; Streaming</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 ml-9 list-disc">
                <li>Captions (subtitles) for pre-recorded and live content</li>
                <li>Audio description for visual information</li>
                <li>Accessible video player controls</li>
                <li>Keyboard operability of all player functions</li>
                <li>User control over caption presentation</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold font-mono text-xs">9</span>
                <h3 className="text-sm font-semibold text-slate-200 dark:text-slate-200 text-slate-800">Clause 9 — Web Content</h3>
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
          <h2 className="text-xl font-bold text-slate-200 dark:text-slate-200 text-slate-800">
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
                desc: 'The tool runs a comprehensive axe-core analysis against your web content, mapping every finding directly to the relevant EN 301 549 clauses. Issues that would take days to identify manually are surfaced instantly.',
              },
              {
                title: 'Streaming player analysis',
                desc: 'The tool inspects your video player for caption support, audio description tracks, keyboard accessibility, and player control compliance — requirements specific to Clause 7 that generic accessibility tools typically miss entirely.',
              },
              {
                title: 'Manifest inspection',
                desc: 'HLS and DASH manifests are parsed to verify the presence of subtitle tracks and alternative audio tracks at the source level, before they even reach the player.',
              },
              {
                title: 'EN 301 549 clause mapping',
                desc: 'Every finding is mapped to its corresponding EN 301 549 clause, giving you a report that speaks the same language as the regulation. This is the format auditors and legal teams expect.',
              },
              {
                title: 'Exportable compliance reports',
                desc: 'Reports can be exported as PDF or JSON, suitable for internal documentation, regulatory submissions, or evidence in conformity assessments.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                <div>
                  <span className="text-sm font-medium text-slate-200 dark:text-slate-200 text-slate-800">{item.title}</span>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Important note */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4 border-l-2 border-yellow-500/50">
          <h2 className="text-xl font-bold text-slate-200 dark:text-slate-200 text-slate-800">
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
          <h2 className="text-xl font-bold text-slate-200 dark:text-slate-200 text-slate-800">
            How to Use
          </h2>
          <ol className="space-y-3 pt-1">
            {[
              { step: '1', text: 'Enter the URL of your streaming service on the home page and press "Check Compliance".' },
              { step: '2', text: 'The tool loads your site in a headless browser, runs WCAG 2.1 AA checks, and analyses the video player and streaming manifests.' },
              { step: '3', text: 'Review the compliance report. Each finding is categorised by EN 301 549 clause, severity, and status (pass, fail, or needs review).' },
              { step: '4', text: 'Export the report as PDF for documentation, or as JSON for integration with your internal systems.' },
              { step: '5', text: 'Address the identified issues and re-scan to verify remediation.' },
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
          <h2 className="text-xl font-bold text-slate-200 dark:text-slate-200 text-slate-800">
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-8 py-3 text-sm font-bold text-white dark:text-white text-slate-900 hover:from-brand-500 hover:to-cyan-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all shadow-lg shadow-brand-500/20"
          >
            Start a Compliance Scan
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
