import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '../components/SEO';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AccessibilityPage() {
  return (
    <main id="main-content" className="flex-1 px-4 py-12">
      <SEO
        title="Accessibility Statement | EAA Checker"
        description="EAA Checker accessibility statement. Learn about the accessibility features, known limitations, and how to report issues with this tool."
        path="/accessibility"
      />
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
            Back to scanner
          </Link>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Accessibility Statement
          </h1>
          <p className="mt-3 text-slate-500">
            Last updated: March 2026
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Commitment</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              EAA Checker is committed to ensuring digital accessibility for all users, including people with disabilities. We strive to conform to the <a href="https://www.w3.org/TR/WCAG22/" className="text-brand-400 hover:text-brand-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</a> and the requirements of <a href="https://www.etsi.org/deliver/etsi_en/301500_301599/301549/" className="text-brand-400 hover:text-brand-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">EN 301 549</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Conformance Status</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              EAA Checker is <strong className="text-slate-700 dark:text-slate-300">partially conformant</strong> with WCAG 2.2 Level AA. "Partially conformant" means that some parts of the content do not fully conform to the accessibility standard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Accessibility Features</h2>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {[
                'Semantic HTML structure with proper heading hierarchy',
                'Full keyboard navigation support across all interactive elements',
                'Skip-to-content link for efficient keyboard navigation',
                'ARIA landmarks, labels, and live regions for screen reader compatibility',
                'Colour contrast ratios meeting WCAG 2.2 AA requirements',
                'Responsive design that works across devices and screen sizes',
                'Light and dark theme with system preference detection',
                'Focus indicators on all interactive elements',
                'Form inputs with proper labels and error messages',
                'No content that flashes more than three times per second',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Known Limitations</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Despite our efforts, some areas may have limitations:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {[
                'PDF and VPAT exports are generated using jsPDF and may not be fully tagged for screen reader accessibility.',
                'The scan activity log during analysis is decorative and marked aria-hidden; real scan progress is communicated via the progress indicator and status text.',
                'Some chart visualisations (radar chart, score gauge) use SVG without full text alternatives, though the equivalent data is presented in text form nearby.',
                'Third-party content loaded from scanned sites may introduce accessibility issues in report screenshots.',
              ].map((limitation) => (
                <li key={limitation} className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {limitation}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Technologies Used</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This website relies on the following technologies for conformance:
            </p>
            <div className="flex flex-wrap gap-2">
              {['HTML', 'CSS', 'JavaScript', 'WAI-ARIA', 'SVG'].map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Assessment Method</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This website was assessed using the following methods:
            </p>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>Self-evaluation using EAA Checker's own automated EN 301 549 audit</li>
              <li>Manual keyboard navigation testing</li>
              <li>Screen reader testing (VoiceOver on macOS)</li>
              <li>Colour contrast analysis using axe-core</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Feedback</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We welcome feedback on the accessibility of EAA Checker. If you encounter any accessibility barriers or have suggestions for improvement, please reach out:
            </p>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>
                GitHub Issues:{' '}
                <a
                  href="https://github.com/anderswassen/eaa-stream-checker/issues"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report an accessibility issue
                </a>
              </li>
            </ul>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We aim to respond to accessibility feedback within 5 business days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Enforcement</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              The European Accessibility Act (Directive 2019/882) provides for enforcement by national market surveillance authorities designated by each EU member state. If you are not satisfied with our response to your accessibility feedback, you may contact the relevant authority in your country.
            </p>
          </section>
        </motion.div>
      </motion.div>
    </main>
  );
}
