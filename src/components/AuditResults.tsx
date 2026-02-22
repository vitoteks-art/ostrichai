import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  Clock,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  Award,
  Zap,
  Shield,
  Crown
} from 'lucide-react';
import { AuditResultsData, AuditData, Projections, Recommendation, RevenueLeak, Benchmarks } from '@/pages/RevenueAudit';
import { useCurrency } from '@/lib/currencyUtils';

interface AuditResultsProps {
  results: AuditResultsData;
  businessData: AuditData;
  onStartOver: () => void;
}

const AuditResults: React.FC<AuditResultsProps> = ({ results, businessData, onStartOver }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { formatCurrency, convertAndFormat } = useCurrency();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-accent bg-accent/10 border-accent/20';
    return 'text-destructive bg-destructive/10 border-destructive/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatRevenueLeak = (impact: number) => {
    return formatCurrency(impact);
  };

  const formatProjection = (amount: number) => {
    return formatCurrency(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Award className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Your Revenue Audit Results
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Here's your personalized analysis for <strong>{businessData.companyName}</strong>
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-semibold mb-4 ${getScoreColor(results.overallScore)}`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Overall Score: {results.overallScore}/100 - {getScoreLabel(results.overallScore)}
              </div>
              <div className="mb-6">
                <div className="text-6xl font-bold text-primary mb-2">{results.overallScore}</div>
                <Progress value={results.overallScore} className="w-full max-w-md mx-auto h-3" />
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {results.overallScore >= 80
                  ? "Excellent! Your lead management process is well-optimized with room for fine-tuning."
                  : results.overallScore >= 60
                    ? "Good foundation! There are clear opportunities to improve your revenue potential."
                    : "There's significant room for improvement in your lead management process."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue-leaks">Revenue Leaks</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-muted-foreground">Monthly Leads</span>
                    <span className="font-semibold">{businessData.monthlyLeads.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-muted-foreground">Avg Deal Value</span>
                    <span className="font-semibold">{formatCurrency(businessData.avgDealValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-semibold">{businessData.currentResponseTime} hours</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-semibold">{businessData.currentConversionRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {results.aiInsights || "Your audit reveals significant opportunities to improve lead response times and qualification processes. By addressing the identified revenue leaks, you can expect substantial improvements in conversion rates and revenue growth."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Revenue Leaks Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Top Revenue Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.revenueLeaks.slice(0, 3).map((leak, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{leak.category}</div>
                        <div className="text-sm text-muted-foreground">{leak.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{formatRevenueLeak(leak.impact)}</div>
                        <div className="text-xs text-muted-foreground">annual impact</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Leaks Tab */}
          <TabsContent value="revenue-leaks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Revenue Leaks Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.revenueLeaks.map((leak, index) => (
                    <div key={index} className="border border-border/50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{leak.category}</h3>
                          <p className="text-muted-foreground mb-3">{leak.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-red-600">{formatRevenueLeak(leak.impact)}</div>
                          <div className="text-sm text-muted-foreground">Annual Impact</div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                          <div>
                            <div className="font-medium text-green-800 mb-1">Solution</div>
                            <div className="text-green-700">{leak.solution}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-muted-foreground">Confidence: {leak.confidence}%</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Priority Impact
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current vs Projected */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    Revenue Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-muted-foreground">Current Monthly Revenue</span>
                      <span className="font-semibold text-red-600">{formatProjection(results.projections.currentMonthlyRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-muted-foreground">Conservative Projection</span>
                      <span className="font-semibold text-yellow-600">{formatProjection(results.projections.conservativeMonthlyRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-muted-foreground">Aggressive Projection</span>
                      <span className="font-semibold text-green-600">{formatProjection(results.projections.aggressiveMonthlyRevenue)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Conservative Increase</span>
                      <span className="font-semibold text-green-600">+{formatProjection(results.projections.conservativeIncrease)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Aggressive Increase</span>
                      <span className="font-semibold text-green-600">+{formatProjection(results.projections.aggressiveIncrease)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Annual Projections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    Annual Outlook
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatProjection(results.projections.annualConservative)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">Conservative Annual Projection</div>

                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatProjection(results.projections.annualAggressive)}
                    </div>
                    <div className="text-sm text-muted-foreground">Aggressive Annual Projection</div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">ROI Timeline</div>
                    <div className="font-semibold text-primary">{results.projections.roiTimeline}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence Level: {results.projections.confidenceLevel}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                  Priority Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="border border-border/50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Badge className={`mr-3 ${getPriorityColor(rec.priority)}`}>
                              {rec.priority} Priority
                            </Badge>
                            <span className="text-sm text-muted-foreground">{rec.timeframe}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{rec.title}</h3>
                          <p className="text-muted-foreground mb-3">{rec.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-green-600">+{formatRevenueLeak(rec.estimatedValue)}</div>
                          <div className="text-sm text-muted-foreground">Est. Value</div>
                        </div>
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <div className="font-medium text-primary mb-1">Expected Impact</div>
                        <div className="text-sm text-muted-foreground">{rec.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Industry Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Industry Benchmarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="text-muted-foreground">Industry Average</span>
                      <span className="font-semibold">{formatProjection(results.benchmarks.industryAverage)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="text-muted-foreground">Top Performers</span>
                      <span className="font-semibold">{formatProjection(results.benchmarks.topPerformers)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-muted-foreground">Your Current</span>
                      <span className="font-semibold">{formatProjection(results.projections.currentMonthlyRevenue)}</span>
                    </div>
                  </div>

                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    <div className="font-medium text-accent-foreground mb-2">Your Position</div>
                    <div className="text-sm text-muted-foreground">{results.benchmarks.yourPosition}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Industry Conversion Rate</span>
                      <span className="font-semibold">{results.benchmarks.industryConversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Your Conversion Rate</span>
                      <span className="font-semibold">{businessData.currentConversionRate}%</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Opportunity</span>
                    </div>
                    <div className="text-sm text-green-700">
                      You have room to improve your conversion rate by {((results.benchmarks.industryConversionRate - businessData.currentConversionRate) / businessData.currentConversionRate * 100).toFixed(1)}% to reach industry average.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button onClick={onStartOver} variant="outline" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Audit
          </Button>
          <Button className="bg-primary hover:bg-primary/90 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download Full Report
          </Button>
          <Button variant="outline" className="flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 p-6 bg-muted/20 rounded-lg border border-border/50">
          <p className="text-sm text-muted-foreground">
            Report generated on {new Date(results.metadata.analysisDate).toLocaleDateString()} |
            Business size: {results.metadata.businessSize} |
            Analysis based on industry standards and AI-powered insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditResults;
