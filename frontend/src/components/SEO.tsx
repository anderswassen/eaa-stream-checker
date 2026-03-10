import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://www.eaachecker.net';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  article?: boolean;
}

export function SEO({ title, description, path, noindex, article }: SEOProps) {
  const url = `${BASE_URL}${path}`;
  const fullTitle = path === '/'
    ? 'EAA Compliance Checker — European Accessibility Act & EN 301 549 Scanner'
    : `${title} | EAA Checker`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={article ? 'article' : 'website'} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
