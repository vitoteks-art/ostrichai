import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CheckCircle2, Globe, Scan, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionService } from "@/services/subscriptionService";
import { ProjectService } from "@/services/projectService";
import { openSeoAuditPdf } from "@/lib/seoAuditPdf";

interface SeoAuditSummary {
  overall_score: number;
  health_rating: string;
  critical_issues_count: number;
  high_impact_opportunities_count: number;
  quick_wins_count: number;
  executive_summary: string;
}

interface CriticalIssue {
  id?: string;
  title?: string;
  category?: string;
  details?: string;
  severity?: string;
}

interface Opportunity {
  id: string;
  title: string;
  category: string;
  details: string;
  implementation_steps: string[];
  roi_potential: string;
  expected_impact: string;
  estimated_effort: string;
}

interface QuickWin {
  id: string;
  title: string;
  category: string;
  action: string;
  estimated_effort: string;
  expected_impact: string;
}

interface TechnicalDetails {
  status_codes: {
    total_pages: number;
    ok_200: number;
    redirects_3xx: number;
    not_found_404: number;
    server_errors_5xx: number;
  };
  indexing_and_metadata: {
    pages_with_noindex: number;
    missing_canonicals: number;
    duplicate_titles: number;
    missing_meta_descriptions: number;
    titles_too_short: number;
    titles_too_long: number;
  };
  content_metrics: {
    average_word_count: number;
    thin_content_pages_under_300_words: number;
    duplicate_or_near_duplicate_pages: number;
    pages_with_multiple_h1: number;
  };
}

interface NextSteps {
  immediate_this_week: string[];
  short_term_30_days: string[];
  long_term_90_days: string[];
}

interface AuditMetadata {
  analysis_scope: string;
  seo_pillars_covered: string[];
  data_limitations: string[];
}

interface SeoAuditOutput {
  stage: string;
  generated_at: string;
  summary: SeoAuditSummary;
  critical_issues: CriticalIssue[];
  high_impact_opportunities: Opportunity[];
  quick_wins: QuickWin[];
  technical_details: TechnicalDetails;
  next_steps: NextSteps;
  audit_metadata: AuditMetadata;
}

const SEO_AUDIT_WEBHOOK = "https://n8n.getostrichai.com/webhook/seo-audit";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return "";
    }
  }
};

const SeoAudit = () => {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<SeoAuditOutput | null>(null);
  const [auditUrl, setAuditUrl] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  useEffect(() => {
    if (!loading) {
      return undefined;
    }
    setProgress(18);
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 6 : prev));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  const scoreTone = useMemo(() => {
    if (!auditResult) {
      return "text-foreground";
    }
    const score = auditResult.summary.overall_score;
    if (score >= 85) {
      return "text-emerald-400";
    }
    if (score >= 70) {
      return "text-amber-400";
    }
    return "text-rose-400";
  }, [auditResult]);

  const formattedDate = useMemo(() => {
    if (!auditResult?.generated_at) {
      return null;
    }
    const date = new Date(auditResult.generated_at);
    if (Number.isNaN(date.getTime())) {
      return auditResult.generated_at;
    }
    return date.toLocaleString();
  }, [auditResult]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setAuditResult(null);

    const normalizedUrl = normalizeUrl(urlInput);
    if (!normalizedUrl) {
      setErrorMessage("Enter a valid URL, like https://example.com");
      return;
    }

    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to run an SEO audit.",
        variant: "destructive",
      });
      return;
    }

    const creditsNeeded = 2;
    if (creditsNeeded > 0) {
      const creditCheck = await SubscriptionService.useCredits(user.id, "seo_audit", creditsNeeded);
      if (!creditCheck.success) {
        let errorMsg = creditCheck.error || "Failed to process credit deduction";
        if (errorMsg.includes("404") || errorMsg.includes("Unexpected token")) {
          errorMsg = "Credit system error. Please try again later.";
        } else if (subscription && subscription.credit_balance < creditsNeeded) {
          errorMsg = `Insufficient credits for SEO audit. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}.`;
        }
        toast({
          title: "Credit Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Credits Deducted",
        description: `✅ ${creditsNeeded} credits deducted for SEO audit`,
      });
    }

    setAuditUrl(normalizedUrl);
    setLoading(true);
    try {
      const response = await fetch(SEO_AUDIT_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ URL: normalizedUrl }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Webhook responded with ${response.status}${message ? `: ${message}` : ""}`);
      }

      const payload = await response.json();
      const payloadItem = Array.isArray(payload) ? payload[0] : payload;
      const output = payloadItem?.output ?? payloadItem;
      if (!output?.summary) {
        throw new Error("Unexpected response shape from the webhook.");
      }

      const typedOutput = output as SeoAuditOutput;
      setAuditResult(typedOutput);
      setProgress(100);

      if (user?.id) {
        try {
          const projectTitle = `SEO Audit: ${normalizedUrl}`;
          const projectResult = await ProjectService.createProject(user.id, {
            title: projectTitle,
            type: "seo_audit",
            status: "completed",
            project_metadata: {
              url: normalizedUrl,
              summary: typedOutput.summary,
              auditResult: typedOutput,
              projectType: "seo_audit",
            },
          });

          if (projectResult.success) {
            await ProjectService.logActivity(user.id, {
              action: "Completed seo_audit",
              details: `Completed SEO audit: ${normalizedUrl}`,
              activity_metadata: {
                category: "completion",
                productType: "seo_audit",
                url: normalizedUrl,
              },
            });
          }
        } catch (projectError) {
          console.error("Failed to save SEO audit project:", projectError);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="SEO Audit | OstrichAi"
        description="Run a fast, AI-powered SEO audit. Paste a URL, get a clean scorecard, and export actionable fixes."
      />
      <div className="container mx-auto px-4 pb-24">
        <section className="relative overflow-hidden pt-20 pb-12">
          <div className="absolute inset-0 -z-10 opacity-60">
            <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-primary/30 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-pulse" />
          </div>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
                <Scan className="h-4 w-4" />
                <span>AI SEO Health Check</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
                See your search visibility
                <span className="gradient-text block">before competitors do.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Paste any website URL and receive a clean, executive-ready SEO report with priority fixes,
                technical diagnostics, and immediate wins.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Instant scorecard
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI recommendations
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Globe className="mr-2 h-4 w-4" />
                  Shareable report
                </Badge>
              </div>
            </div>
            <Card className="bg-card/80 border-border/60 shadow-2xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Run a fresh audit</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="seo-url" className="text-sm text-muted-foreground">
                      Website URL
                    </label>
                    <Input
                      id="seo-url"
                      type="text"
                      placeholder="https://yourdomain.com"
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      className="h-12 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      We will only analyze the URL you provide. No login required.
                    </p>
                  </div>
                  {errorMessage && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  )}
                  <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
                    {loading ? "Running audit..." : "Generate SEO Audit"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
                {loading && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Analyzing technical signals</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {auditResult && (
          <section className="mt-16 space-y-10">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                onClick={() => openSeoAuditPdf(auditResult, auditUrl)}
              >
                Download PDF
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    SEO Score
                    <Badge variant="outline">{auditResult.summary.health_rating}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`text-5xl font-semibold ${scoreTone}`}>{auditResult.summary.overall_score}</div>
                  <Progress value={auditResult.summary.overall_score} />
                  <p className="text-sm text-muted-foreground">{auditResult.summary.executive_summary}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle>Audit Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Critical issues</span>
                    <span className="text-foreground font-medium">{auditResult.summary.critical_issues_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>High-impact opportunities</span>
                    <span className="text-foreground font-medium">{auditResult.summary.high_impact_opportunities_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quick wins</span>
                    <span className="text-foreground font-medium">{auditResult.summary.quick_wins_count}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Stage: {auditResult.stage}
                    </div>
                    {formattedDate && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Generated {formattedDate}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle>Technical Signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pages scanned</span>
                    <span className="font-medium">{auditResult.technical_details.status_codes.total_pages}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                      200 OK: {auditResult.technical_details.status_codes.ok_200}
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                      3xx: {auditResult.technical_details.status_codes.redirects_3xx}
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                      404: {auditResult.technical_details.status_codes.not_found_404}
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                      5xx: {auditResult.technical_details.status_codes.server_errors_5xx}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle>High-Impact Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {auditResult.high_impact_opportunities.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/10 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.details}</p>
                        </div>
                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                        <div>
                          <span className="text-foreground font-medium">ROI:</span> {item.roi_potential}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Effort:</span> {item.estimated_effort}
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{item.expected_impact}</p>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {item.implementation_steps.map((step) => (
                            <li key={step} className="flex gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-card/80 border-border/60">
                  <CardHeader>
                    <CardTitle>Quick Wins</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {auditResult.quick_wins.map((win) => (
                      <div key={win.id} className="rounded-xl border border-border/60 bg-muted/10 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{win.title}</h4>
                          <Badge variant="outline">{win.category}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{win.action}</p>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Effort: <span className="text-foreground">{win.estimated_effort}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{win.expected_impact}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card/80 border-border/60">
                  <CardHeader>
                    <CardTitle>Critical Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {auditResult.critical_issues.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        No critical issues detected.
                      </div>
                    ) : (
                      auditResult.critical_issues.map((issue) => (
                        <div key={issue.id ?? issue.title} className="rounded-xl border border-border/60 bg-muted/10 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{issue.title ?? "Critical Issue"}</h4>
                            <Badge variant="destructive">{issue.severity ?? "High"}</Badge>
                          </div>
                          {issue.details && (
                            <p className="mt-2 text-sm text-muted-foreground">{issue.details}</p>
                          )}
                          {issue.category && (
                            <p className="mt-2 text-xs text-muted-foreground">Category: {issue.category}</p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle>Indexing & Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Missing canonicals</span>
                    <span className="text-foreground">{auditResult.technical_details.indexing_and_metadata.missing_canonicals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duplicate titles</span>
                    <span className="text-foreground">{auditResult.technical_details.indexing_and_metadata.duplicate_titles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Missing meta descriptions</span>
                    <span className="text-foreground">{auditResult.technical_details.indexing_and_metadata.missing_meta_descriptions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Titles too long</span>
                    <span className="text-foreground">{auditResult.technical_details.indexing_and_metadata.titles_too_long}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle>Content Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Avg. word count</span>
                    <span className="text-foreground">{auditResult.technical_details.content_metrics.average_word_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Thin pages &lt; 300 words</span>
                    <span className="text-foreground">{auditResult.technical_details.content_metrics.thin_content_pages_under_300_words}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duplicate pages</span>
                    <span className="text-foreground">{auditResult.technical_details.content_metrics.duplicate_or_near_duplicate_pages}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pages with multiple H1</span>
                    <span className="text-foreground">{auditResult.technical_details.content_metrics.pages_with_multiple_h1}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 border-border/60">
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <div className="text-foreground font-medium mb-2">This week</div>
                    <ul className="space-y-2">
                      {auditResult.next_steps.immediate_this_week.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-foreground font-medium mb-2">Next 30 days</div>
                    <ul className="space-y-2">
                      {auditResult.next_steps.short_term_30_days.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-foreground font-medium mb-2">Next 90 days</div>
                    <ul className="space-y-2">
                      {auditResult.next_steps.long_term_90_days.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/80 border-border/60">
              <CardHeader>
                <CardTitle>Audit Metadata</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_1fr] text-sm text-muted-foreground">
                <div>
                  <div className="text-foreground font-medium mb-2">Scope</div>
                  <p>{auditResult.audit_metadata.analysis_scope}</p>
                  <div className="mt-4 text-foreground font-medium">SEO pillars covered</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {auditResult.audit_metadata.seo_pillars_covered.map((pillar) => (
                      <Badge key={pillar} variant="secondary">
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-foreground font-medium mb-2">Data limitations</div>
                  <ul className="space-y-2">
                    {auditResult.audit_metadata.data_limitations.map((item) => (
                      <li key={item} className="flex gap-2">
                        <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default SeoAudit;
