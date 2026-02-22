import { ScriptGeneratorForm } from "@/components/ScriptGeneratorForm";
import { FeatureGate } from "@/components/FeatureGate";
import { Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const YouTubeScript = () => {
  return (
    <Layout>
      <SEO
        title="AI YouTube Script Generator | Compelling Video Scripts"
        description="Create engaging scripts for your YouTube videos with AI. Transform your ideas into professional scripts optimized for viewer retention."
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
        <div className="container mx-auto px-4 py-16 md:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Script Generator</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Create Stunning</span>
              <br />
              <span className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(24,95%,53%)] bg-clip-text text-transparent">
                YouTube Scripts
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your video ideas into compelling scripts with our advanced AI-powered workflow automation system.
            </p>
          </div>

          {/* Form Section */}
          <div className="relative">
            {/* Decorative glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(217,91%,60%,0.1)] to-[hsl(24,95%,53%,0.1)] blur-3xl -z-10 rounded-3xl" />

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 shadow-2xl">
              <FeatureGate feature="scriptGeneration">
                <ScriptGeneratorForm />
              </FeatureGate>
            </div>
          </div>


        </div>
      </div>
    </Layout>
  );
};

export default YouTubeScript;
