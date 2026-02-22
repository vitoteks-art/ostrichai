type SeoAuditSummary = {
  overall_score: number;
  health_rating: string;
  critical_issues_count: number;
  high_impact_opportunities_count: number;
  quick_wins_count: number;
  executive_summary: string;
};

type SeoAuditOutput = {
  stage?: string;
  generated_at?: string;
  summary: SeoAuditSummary;
  critical_issues?: Array<{
    id?: string;
    title?: string;
    category?: string;
    details?: string;
    severity?: string;
  }>;
  high_impact_opportunities?: Array<{
    id?: string;
    title?: string;
    category?: string;
    details?: string;
    implementation_steps?: string[];
    roi_potential?: string;
    expected_impact?: string;
    estimated_effort?: string;
  }>;
  quick_wins?: Array<{
    id?: string;
    title?: string;
    category?: string;
    action?: string;
    estimated_effort?: string;
    expected_impact?: string;
  }>;
  technical_details?: {
    status_codes?: Record<string, number>;
    indexing_and_metadata?: Record<string, number>;
    content_metrics?: Record<string, number>;
  };
  next_steps?: {
    immediate_this_week?: string[];
    short_term_30_days?: string[];
    long_term_90_days?: string[];
  };
  audit_metadata?: {
    analysis_scope?: string;
    seo_pillars_covered?: string[];
    data_limitations?: string[];
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const listItems = (items?: string[]) => {
  if (!items || items.length === 0) {
    return "<p class=\"muted\">None listed.</p>";
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
};

export const openSeoAuditPdf = (audit: SeoAuditOutput, url?: string) => {
  if (typeof window === "undefined") return;

  const summary = audit.summary;
  const opportunities = audit.high_impact_opportunities || [];
  const quickWins = audit.quick_wins || [];
  const criticalIssues = audit.critical_issues || [];
  const technical = audit.technical_details || {};
  const metadata = audit.audit_metadata || {};
  const nextSteps = audit.next_steps || {};

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SEO Audit Report</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        font-family: "Georgia", "Times New Roman", serif;
        margin: 32px;
        color: #111827;
      }
      h1, h2, h3 {
        margin: 0 0 12px;
      }
      h1 {
        font-size: 28px;
        letter-spacing: 0.4px;
      }
      h2 {
        font-size: 20px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 6px;
        margin-top: 28px;
      }
      h3 {
        font-size: 16px;
        margin-top: 16px;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 24px;
        font-size: 13px;
        color: #6b7280;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        background: #f9fafb;
      }
      .score {
        font-size: 36px;
        font-weight: 700;
        color: #047857;
      }
      .muted {
        color: #6b7280;
        font-size: 13px;
      }
      .pill {
        display: inline-block;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        color: #1f2937;
        background: #f3f4f6;
      }
      ul {
        padding-left: 18px;
        margin: 8px 0 0;
      }
      li {
        margin-bottom: 6px;
      }
      .two-col {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .section-block {
        margin-top: 14px;
      }
      .opportunity {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 12px;
      }
      .issue {
        border-left: 4px solid #ef4444;
        padding-left: 12px;
        margin-bottom: 10px;
      }
      .win {
        border-left: 4px solid #10b981;
        padding-left: 12px;
        margin-bottom: 10px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        padding-top: 12px;
      }
    </style>
  </head>
  <body>
    <h1>SEO Audit Report</h1>
    <div class="meta">
      ${url ? `<div><strong>URL:</strong> ${escapeHtml(url)}</div>` : ""}
      ${audit.stage ? `<div><strong>Stage:</strong> ${escapeHtml(audit.stage)}</div>` : ""}
      ${audit.generated_at ? `<div><strong>Generated:</strong> ${escapeHtml(formatDate(audit.generated_at))}</div>` : ""}
    </div>

    <div class="summary-grid">
      <div class="card">
        <div class="muted">Overall Score</div>
        <div class="score">${summary.overall_score}</div>
        <div class="pill">${escapeHtml(summary.health_rating)}</div>
      </div>
      <div class="card">
        <h3>Highlights</h3>
        <div class="muted">Critical issues: ${summary.critical_issues_count}</div>
        <div class="muted">High-impact: ${summary.high_impact_opportunities_count}</div>
        <div class="muted">Quick wins: ${summary.quick_wins_count}</div>
      </div>
      <div class="card">
        <h3>Executive Summary</h3>
        <p class="muted">${escapeHtml(summary.executive_summary)}</p>
      </div>
    </div>

    <h2>High-Impact Opportunities</h2>
    ${opportunities.length === 0 ? "<p class=\"muted\">None listed.</p>" : opportunities.map((item) => `
      <div class="opportunity">
        <h3>${escapeHtml(item.title || "Opportunity")}</h3>
        <div class="muted">${escapeHtml(item.details || "")}</div>
        <div class="section-block">
          <span class="pill">${escapeHtml(item.category || "Category")}</span>
          ${item.roi_potential ? `<span class="pill">ROI: ${escapeHtml(item.roi_potential)}</span>` : ""}
          ${item.estimated_effort ? `<span class="pill">Effort: ${escapeHtml(item.estimated_effort)}</span>` : ""}
        </div>
        ${item.expected_impact ? `<p class="muted">${escapeHtml(item.expected_impact)}</p>` : ""}
          ${item.implementation_steps && item.implementation_steps.length > 0 ? `
            <h3>Implementation Steps</h3>
          ${listItems(item.implementation_steps)}
        ` : ""}
      </div>
    `).join("")}

    <h2>Quick Wins</h2>
    ${quickWins.length === 0 ? "<p class=\"muted\">None listed.</p>" : quickWins.map((win) => `
      <div class="win">
        <strong>${escapeHtml(win.title || "Quick win")}</strong>
        ${win.category ? `<span class="pill">${escapeHtml(win.category)}</span>` : ""}
        ${win.action ? `<p class="muted">${escapeHtml(win.action)}</p>` : ""}
        ${win.estimated_effort ? `<p class="muted">Effort: ${escapeHtml(win.estimated_effort)}</p>` : ""}
        ${win.expected_impact ? `<p class="muted">${escapeHtml(win.expected_impact)}</p>` : ""}
      </div>
    `).join("")}

    <h2>Critical Issues</h2>
    ${criticalIssues.length === 0 ? "<p class=\"muted\">No critical issues detected.</p>" : criticalIssues.map((issue) => `
      <div class="issue">
        <strong>${escapeHtml(issue.title || "Critical issue")}</strong>
        ${issue.severity ? `<span class="pill">${escapeHtml(issue.severity)}</span>` : ""}
        ${issue.details ? `<p class="muted">${escapeHtml(issue.details)}</p>` : ""}
      </div>
    `).join("")}

    <h2>Technical Snapshot</h2>
    <div class="two-col">
      <div class="card">
        <h3>Status Codes</h3>
        ${technical.status_codes ? `
          <div class="muted">Total pages: ${technical.status_codes.total_pages ?? 0}</div>
          <div class="muted">200 OK: ${technical.status_codes.ok_200 ?? 0}</div>
          <div class="muted">3xx: ${technical.status_codes.redirects_3xx ?? 0}</div>
          <div class="muted">404: ${technical.status_codes.not_found_404 ?? 0}</div>
          <div class="muted">5xx: ${technical.status_codes.server_errors_5xx ?? 0}</div>
        ` : "<p class=\"muted\">No status code data.</p>"}
      </div>
      <div class="card">
        <h3>Indexing & Metadata</h3>
        ${technical.indexing_and_metadata ? `
          <div class="muted">Missing canonicals: ${technical.indexing_and_metadata.missing_canonicals ?? 0}</div>
          <div class="muted">Duplicate titles: ${technical.indexing_and_metadata.duplicate_titles ?? 0}</div>
          <div class="muted">Missing descriptions: ${technical.indexing_and_metadata.missing_meta_descriptions ?? 0}</div>
          <div class="muted">Titles too long: ${technical.indexing_and_metadata.titles_too_long ?? 0}</div>
        ` : "<p class=\"muted\">No metadata data.</p>"}
      </div>
    </div>

    <h2>Next Steps</h2>
    <div class="two-col">
      <div class="card">
        <h3>This Week</h3>
        ${listItems(nextSteps.immediate_this_week)}
      </div>
      <div class="card">
        <h3>Next 30 Days</h3>
        ${listItems(nextSteps.short_term_30_days)}
      </div>
    </div>
    <div class="card section-block">
      <h3>Next 90 Days</h3>
      ${listItems(nextSteps.long_term_90_days)}
    </div>

    <h2>Audit Metadata</h2>
    <div class="card">
      ${metadata.analysis_scope ? `<p class="muted">${escapeHtml(metadata.analysis_scope)}</p>` : ""}
      ${metadata.seo_pillars_covered ? `
        <div class="section-block">
          ${metadata.seo_pillars_covered.map((pillar) => `<span class="pill">${escapeHtml(pillar)}</span>`).join("")}
        </div>
      ` : ""}
      ${metadata.data_limitations && metadata.data_limitations.length > 0 ? `
        <div class="section-block">
          <h3>Data Limitations</h3>
          ${listItems(metadata.data_limitations)}
        </div>
      ` : ""}
    </div>

    <div class="footer">Generated by OstrichAi SEO Audit</div>
  </body>
</html>
`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
};
