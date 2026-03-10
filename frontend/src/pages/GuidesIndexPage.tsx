import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '../components/SEO';
import { guides } from '../data/guides';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function GuidesIndexPage() {
  return (
    <main id="main-content" className="flex-1 px-4 py-12">
      <SEO
        title="EAA Compliance Guides for Streaming Services"
        description="In-depth guides on European Accessibility Act compliance for streaming platforms. Learn about EN 301 549 requirements, HLS accessibility, caption compliance, audio description, and EAA fines."
        path="/guides"
      />
      <motion.div
        className="max-w-3xl mx-auto space-y-10"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            EAA Compliance Guides
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            In-depth guides on European Accessibility Act compliance for streaming services.
            Everything you need to understand EN 301 549 requirements and ensure your platform meets the standard.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              to={`/guide/${guide.slug}`}
              className="glass rounded-2xl p-6 sm:p-8 space-y-3 hover:border-brand-500/30 border border-transparent transition-all group"
            >
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-400 transition-colors">
                {guide.title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {guide.metaDescription}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-brand-400 font-medium">
                Read guide
                <svg className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </motion.div>

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
