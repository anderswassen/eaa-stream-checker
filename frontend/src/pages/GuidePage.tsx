import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '../components/SEO';
import { getGuide, getRelatedGuides } from '../data/guides';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuide(slug) : undefined;

  if (!guide) {
    return (
      <main id="main-content" className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Guide Not Found</h1>
          <Link to="/guides" className="text-brand-400 hover:text-brand-300 transition-colors">
            View all guides
          </Link>
        </div>
      </main>
    );
  }

  const related = getRelatedGuides(guide.relatedSlugs);

  return (
    <main id="main-content" className="flex-1 px-4 py-12">
      <SEO
        title={guide.metaTitle}
        description={guide.metaDescription}
        path={`/guide/${guide.slug}`}
        article
      />
      <motion.article
        className="max-w-3xl mx-auto space-y-10"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Breadcrumb */}
        <motion.nav variants={fadeUp} aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-slate-400">
            <li><Link to="/" className="hover:text-brand-400 transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/guides" className="hover:text-brand-400 transition-colors">Guides</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-slate-300 truncate max-w-[200px]">{guide.title.split(':')[0]}</li>
          </ol>
        </motion.nav>

        {/* Title */}
        <motion.header variants={fadeUp} className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {guide.title}
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            {guide.intro}
          </p>
        </motion.header>

        {/* Table of contents */}
        <motion.nav variants={fadeUp} className="glass rounded-2xl p-6 space-y-3" aria-label="Table of contents">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">In this guide</h2>
          <ol className="space-y-2">
            {guide.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </motion.nav>

        {/* Sections */}
        {guide.sections.map((section, i) => (
          <motion.section
            key={i}
            id={`section-${i}`}
            variants={fadeUp}
            className="glass rounded-2xl p-6 sm:p-8 space-y-4 scroll-mt-24"
          >
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {section.heading}
            </h2>
            {section.content.split('\n\n').map((paragraph, j) => (
              <p key={j} className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </motion.section>
        ))}

        {/* CTA */}
        <motion.div variants={fadeUp} className="glass rounded-2xl p-8 text-center space-y-4 border-l-2 border-brand-500/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Test Your Streaming Service Now
          </h2>
          <p className="text-sm text-slate-400">
            Get a full EN 301 549 compliance report in 30 seconds — covering Clause 7 (video) and Clause 9 (web content).
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-8 py-3 text-sm font-bold text-white hover:from-brand-500 hover:to-cyan-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all shadow-lg shadow-brand-500/20"
          >
            Start a Compliance Scan
          </Link>
        </motion.div>

        {/* Related guides */}
        {related.length > 0 && (
          <motion.section variants={fadeUp} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Related Guides</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/guide/${r.slug}`}
                  className="glass rounded-xl p-5 space-y-2 hover:border-brand-500/30 border border-transparent transition-colors group"
                >
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-400 transition-colors">
                    {r.title.split(':')[0]}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{r.metaDescription.slice(0, 120)}...</p>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </motion.article>
    </main>
  );
}
