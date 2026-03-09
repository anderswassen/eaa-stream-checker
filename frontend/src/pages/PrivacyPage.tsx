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

export function PrivacyPage() {
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
            Privacy &amp; Data
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            We built a tool to help with accessibility compliance — the least we can do is be upfront about how it handles your data.
          </p>
        </motion.div>

        {/* What this tool does */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            What this tool does
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            EAA Stream Checker scans web pages and streaming video players for accessibility compliance
            with the European Accessibility Act (EN 301 549). All analysis happens on our server —
            we don't send your URLs or results to any third party.
          </p>
        </motion.section>

        {/* What we store */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            What we store
          </h2>
          <ul className="space-y-3 pt-1">
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Scan results</span>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  When you run a scan, we store the URL, compliance results, and timestamps so you can
                  revisit your report. If no database is configured, results are kept in memory only and
                  disappear when the server restarts.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Theme preference</span>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  We save your light/dark mode choice in your browser's local storage.
                  That's it — one tiny setting.
                </p>
              </div>
            </li>
          </ul>
          <p className="text-sm text-slate-400 leading-relaxed">
            We <strong className="text-slate-700 dark:text-slate-300">don't store</strong> any personal
            information, account details, or login credentials. There are no user accounts.
          </p>
        </motion.section>

        {/* Cookies */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Cookies
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            None. Zero. We don't set any cookies.
          </p>
        </motion.section>

        {/* Third-party services */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Third-party services
          </h2>
          <ul className="space-y-3 pt-1">
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Google Fonts</span>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  We load the Inter and JetBrains Mono typefaces from Google Fonts for the UI.
                  Google may log font requests per their own privacy policy.
                </p>
              </div>
            </li>
          </ul>
          <p className="text-sm text-slate-400 leading-relaxed">
            That's the only external service. No analytics, no tracking pixels, no ads.
          </p>
        </motion.section>

        {/* Your scanned URLs */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Your scanned URLs
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            When you scan a page, our server visits that URL using a browser engine (Chromium) to
            analyse it. We also fetch any video caption files found on the page to check their quality.
            This is all done server-side and the data stays with us.
          </p>
        </motion.section>

        {/* Data retention */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Data retention
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Scan results are kept indefinitely to support historical comparisons and trend tracking.
            If you'd like a scan removed, email us at{' '}
            <a href="mailto:info@eaachecker.net" className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
              info@eaachecker.net
            </a>{' '}
            and we'll take care of it.
          </p>
        </motion.section>

        {/* Questions */}
        <motion.section variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 space-y-4 border-l-2 border-brand-500/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Questions?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            If anything here is unclear, reach out at{' '}
            <a href="mailto:info@eaachecker.net" className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
              info@eaachecker.net
            </a>
            . We built a tool to help with accessibility compliance — the least we can do is be upfront about how it works.
          </p>
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
