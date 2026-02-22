import BlogResearchForm from "@/components/BlogResearchForm";
import { FeatureGate } from "@/components/FeatureGate";
import { Sparkles, BookOpen, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import "@/index.css";

const BlogResearch = () => {
  return (
    <Layout>
      <SEO
        title="AI Blog Research Suite | Content Strategy and Insights"
        description="Optimize your blog strategy with AI-powered research. Generate comprehensive insights, keywords, and content ideas for your blog posts."
      />
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-bg">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm shadow-elegant">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-primary">AI-Powered Research Suite</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Create Stunning
              <br />
              <span className="gradient-text">Blog Research</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your research queries into comprehensive insights with our advanced AI-powered workflow automation system.
            </p>
          </div>

          {/* Research Form */}
          <div className="mt-12">
            <FeatureGate feature="blogResearch">
              <BlogResearchForm />
            </FeatureGate>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="space-y-3 p-4 rounded-lg bg-gradient-card shadow-card transition-all duration-300 hover:shadow-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shadow-button">
                  <Search className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold">Smart Research</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically process and analyze your research queries using advanced AI workflows.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-gradient-card shadow-card transition-all duration-300 hover:shadow-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shadow-button">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold">Content Generation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive blog content based on your research topics and queries.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-gradient-card shadow-card transition-all duration-300 hover:shadow-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shadow-button">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold">Workflow Automation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Seamlessly integrate with n8n workflows to automate your entire research process.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BlogResearch;
