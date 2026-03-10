import type { ScanReport } from '../types/report';

/**
 * Generate an HTML accessibility statement based on scan results.
 * Users download this as an .html file they can adapt and publish.
 */
export function exportAccessibilityStatement(report: ScanReport) {
  const score = report.summary.totalChecks > 0
    ? Math.round((report.summary.passed / report.summary.totalChecks) * 100)
    : 0;

  const scannedDate = new Date(report.scannedAt).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const hostname = new URL(report.url).hostname;

  const conformanceLevel = score === 100
    ? 'fully conformant'
    : score >= 80
      ? 'partially conformant'
      : 'non-conformant';

  const conformanceText = score === 100
    ? 'This service fully conforms to EN 301 549 V3.2.1 (2021-03) and WCAG 2.2 Level AA.'
    : score >= 80
      ? 'This service partially conforms to EN 301 549 V3.2.1 (2021-03) and WCAG 2.2 Level AA. The non-conformances are listed below.'
      : 'This service does not yet fully conform to EN 301 549 V3.2.1 (2021-03) and WCAG 2.2 Level AA. The non-conformances are listed below.';

  const failedClauses = report.clauses.filter(c => c.status === 'fail');
  const reviewClauses = report.clauses.filter(c => c.status === 'needs_review');

  const issueRows = failedClauses.map(c => {
    const severity = c.findings[0]?.severity ?? 'minor';
    return `<tr>
      <td>${c.clauseId}</td>
      <td>${c.title}</td>
      <td>${severity.charAt(0).toUpperCase() + severity.slice(1)}</td>
      <td><em>[Describe workaround or remediation timeline]</em></td>
    </tr>`;
  }).join('\n');

  const reviewRows = reviewClauses.map(c => `<tr>
      <td>${c.clauseId}</td>
      <td>${c.title}</td>
      <td>Needs review</td>
      <td><em>[Requires manual verification]</em></td>
    </tr>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Statement — ${hostname}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 1.75rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin-top: 2rem; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.875rem; }
    th { background: #f8fafc; font-weight: 600; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-full { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef9c3; color: #854d0e; }
    .badge-non { background: #fee2e2; color: #991b1b; }
    .note { background: #f0f9ff; border-left: 3px solid #3b82f6; padding: 0.75rem 1rem; margin: 1rem 0; font-size: 0.875rem; }
    .placeholder { color: #9ca3af; font-style: italic; }
    em { color: #6b7280; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #94a3b8; }
  </style>
</head>
<body>

<h1>Accessibility Statement</h1>

<p><strong><span class="placeholder">[Organisation Name]</span></strong> is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience of <strong>${hostname}</strong> and applying the relevant accessibility standards.</p>

<h2>Conformance Status</h2>

<p>The <a href="https://eur-lex.europa.eu/eli/dir/2019/882/oj">European Accessibility Act (Directive 2019/882)</a> requires that digital services meet the accessibility requirements of <a href="https://www.etsi.org/deliver/etsi_en/301500_301599/301549/">EN 301 549</a>.</p>

<p>Current status: <span class="badge ${score === 100 ? 'badge-full' : score >= 80 ? 'badge-partial' : 'badge-non'}">${conformanceLevel}</span></p>

<p>${conformanceText}</p>

<h2>Assessment</h2>

<p>This accessibility statement was generated based on an automated assessment performed on <strong>${scannedDate}</strong> using <a href="https://www.eaachecker.net">EAA Checker</a>.</p>

<table>
  <tr>
    <th>Metric</th>
    <th>Result</th>
  </tr>
  <tr>
    <td>Compliance score</td>
    <td>${score} / 100</td>
  </tr>
  <tr>
    <td>Checks passed</td>
    <td>${report.summary.passed} of ${report.summary.totalChecks}</td>
  </tr>
  <tr>
    <td>Checks failed</td>
    <td>${report.summary.failed}</td>
  </tr>
  <tr>
    <td>Needs review</td>
    <td>${report.summary.needsReview}</td>
  </tr>
  <tr>
    <td>Standard</td>
    <td>EN 301 549 V3.2.1 (WCAG 2.2 Level AA)</td>
  </tr>
  <tr>
    <td>URL assessed</td>
    <td><a href="${report.url}">${report.url}</a></td>
  </tr>
</table>

${failedClauses.length > 0 || reviewClauses.length > 0 ? `
<h2>Known Issues</h2>

<p>The following accessibility issues were identified during the assessment:</p>

<table>
  <tr>
    <th>Clause</th>
    <th>Requirement</th>
    <th>Status</th>
    <th>Workaround / Remediation</th>
  </tr>
  ${issueRows}
  ${reviewRows}
</table>

<div class="note">
  <strong>Note:</strong> The workaround and remediation columns above contain placeholder text. Please update them with your specific plans and timelines before publishing this statement.
</div>
` : `
<p>No accessibility issues were identified during the automated assessment.</p>
`}

<h2>Feedback</h2>

<p>We welcome your feedback on the accessibility of <strong>${hostname}</strong>. Please let us know if you encounter accessibility barriers:</p>

<ul>
  <li>Email: <span class="placeholder">[accessibility@${hostname}]</span></li>
  <li>Phone: <span class="placeholder">[phone number]</span></li>
</ul>

<p>We aim to respond to accessibility feedback within <span class="placeholder">[X business days]</span>.</p>

<h2>Enforcement Procedure</h2>

<p>If you are not satisfied with our response, you may contact the relevant market surveillance authority in your EU member state. The European Accessibility Act (Directive 2019/882) provides for enforcement by national authorities designated by each member state.</p>

<h2>Technical Specifications</h2>

<p>This service relies on the following technologies for conformance with EN 301 549 and WCAG 2.2 Level AA:</p>

<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
  <li>WAI-ARIA</li>
</ul>

<footer>
  <p>This accessibility statement was generated on ${scannedDate} using <a href="https://www.eaachecker.net">EAA Checker</a> and should be reviewed and customised before publication. Placeholders marked in grey require your input.</p>
  <p>Last updated: <span class="placeholder">[date]</span></p>
</footer>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accessibility-statement-${hostname}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
