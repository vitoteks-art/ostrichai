import { EnhancedScriptGeneratorForm } from "@/components/EnhancedScriptGeneratorForm";
import { FeatureGate } from "@/components/FeatureGate";
import { Sparkles, Clock, Target, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const EnhancedYouTubeScript = () => {
  return (
    <Layout>
      <SEO
        title="Advanced AI YouTube Script Creator | Professional Narratives"
        description="Generate sophisticated, documentary-style YouTube scripts with AI. Advanced control over temporal focus, controversy levels, and audience targeting."
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
        <div className="container mx-auto px-4 py-16 md:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Advanced AI-Powered Script Generator</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Create Advanced</span>
              <br />
              <span className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(24,95%,53%)] bg-clip-text text-transparent">
                YouTube Scripts
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Generate sophisticated documentary-style scripts with our enhanced AI system featuring temporal focus, controversy level control, and advanced targeting options.
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Temporal Focus Control</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/5 rounded-full border border-secondary/20">
                <Target className="w-4 h-4 text-secondary-foreground" />
                <span className="text-sm font-medium">Advanced Targeting</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/5 rounded-full border border-accent/20">
                <AlertTriangle className="w-4 h-4 text-accent-foreground" />
                <span className="text-sm font-medium">Controversy Level Management</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="relative">
            {/* Decorative glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(217,91%,60%,0.1)] to-[hsl(24,95%,53%,0.1)] blur-3xl -z-10 rounded-3xl" />

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 shadow-2xl">
              <FeatureGate feature="scriptGeneration">
                <EnhancedScriptGeneratorForm />
              </FeatureGate>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-16 text-center space-y-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Perfect for Documentary-Style Content
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="space-y-3 p-6 bg-card/30 rounded-lg border border-border/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Temporal Structure</h3>
                  <p className="text-muted-foreground">
                    Choose from Past, Present, Future, or Cross-temporal focus to determine your script's narrative structure (Types A-E).
                  </p>
                </div>

                <div className="space-y-3 p-6 bg-card/30 rounded-lg border border-border/50">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Smart Targeting</h3>
                  <p className="text-muted-foreground">
                    Specify your audience demographics and content angle to create perfectly tailored scripts for your viewers.
                  </p>
                </div>

                <div className="space-y-3 p-6 bg-card/30 rounded-lg border border-border/50">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Controversy Management</h3>
                  <p className="text-muted-foreground">
                    Control how your script handles sensitive topics with low, medium, or high controversy level settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedYouTubeScript;
