import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import BlogPostDisplay from "./BlogPostDisplay";
import BlogLayout from "./blog/BlogLayout";
import { CreditDisplay } from "./ads/CreditDisplay";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { SubscriptionService } from "../services/subscriptionService";
import {
  generateBlogTitles,
  generateBlogSections,
  generateBlogSeo,
  generateBlogContent
} from "../services/blogResearchService";
import { BlogContent, BlogResearchState, BlogSeo, BlogSection, BlogSectionSource, BlogStep, BlogTopic } from "../types/blogResearch";

const STORAGE_KEY = "OstrichAi_blog_research_state";

const getMaxStep = (state: BlogResearchState) => {
  if (state.content) return BlogStep.CONTENT;
  if (state.seo) return BlogStep.SEO;
  if (state.sections.length > 0) return BlogStep.SECTIONS;
  if (state.titles.length > 0) return BlogStep.TITLE;
  return BlogStep.TITLE;
};

const normalizeResponse = (data: any): any => {
  if (!data) return null;
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    const outputItem = data.find(item => item && (item.output || item.data));
    if (outputItem) return normalizeResponse(outputItem);
    return data;
  }
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    return normalizeResponse(data.data[0]);
  }
  if (data.output) return data.output;
  return data;
};

const extractStringList = (data: any, keys: string[]) => {
  const normalized = normalizeResponse(data);
  if (!normalized) return [];

  if (Array.isArray(normalized) && normalized.every(item => typeof item === "string")) {
    return normalized;
  }

  if (Array.isArray(normalized.topics)) {
    return normalized.topics
      .map((topic: any) => (typeof topic?.title === "string" ? topic.title : null))
      .filter(Boolean) as string[];
  }

  for (const key of keys) {
    const value = normalized[key];
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === "string");
    }
    if (typeof value === "string") {
      return value.split("\n").map(item => item.trim()).filter(Boolean);
    }
  }

  if (typeof normalized.title === "string") {
    return [normalized.title];
  }

  return [];
};

const extractTopics = (data: any): BlogTopic[] => {
  const normalized = normalizeResponse(data);
  if (!normalized || !Array.isArray(normalized.topics)) return [];

  return normalized.topics
    .filter((topic: any) => topic && typeof topic.title === "string")
    .map((topic: any) => ({
      title: topic.title,
      difficultyScore: topic.difficultyScore,
      searchVolumeTier: topic.searchVolumeTier,
      targetAudience: topic.targetAudience,
      searchIntent: topic.searchIntent,
      powerWordsUsed: Array.isArray(topic.powerWordsUsed) ? topic.powerWordsUsed : []
    }));
};

const extractSections = (data: any): BlogSection[] => {
  const normalized = normalizeResponse(data);
  if (!normalized || !Array.isArray(normalized.sections)) return [];

  return normalized.sections
    .filter((section: any) => section && typeof section.section_name === "string")
    .map((section: any) => ({
      section_name: section.section_name,
      section_word_count: section.section_word_count,
      overview_idea: section.overview_idea
    }));
};

const extractSectionSources = (data: any): BlogSectionSource[] => {
  if (!Array.isArray(data)) return [];
  const sourcesContainer = data.find(item => item && Array.isArray(item.sources));
  if (!sourcesContainer) return [];

  return sourcesContainer.sources
    .filter((source: any) => source && typeof source.url === "string")
    .map((source: any) => ({
      url: source.url,
      reason: source.reason
    }));
};

const normalizeOutlineToSections = (outline: string) => {
  return outline
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
};

const extractSeo = (data: any): BlogSeo | null => {
  const normalized = normalizeResponse(data);
  if (!normalized || typeof normalized !== "object") return null;
  const toKeywords = (value: any) => String(value)
    .split(",")
    .map((item: string) => item.trim())
    .filter(Boolean);

  if (Array.isArray(normalized)) {
    return normalized.map((entry: any) => {
      if (entry && typeof entry === "object" && entry.keywords_csv && !entry.keywords) {
        return { ...entry, keywords: toKeywords(entry.keywords_csv) };
      }
      return entry;
    });
  }

  const maybeArray = normalized;
  if (maybeArray && typeof maybeArray === "object") {
    if (maybeArray.keywords_csv && !maybeArray.keywords) {
      return {
        ...maybeArray,
        keywords: toKeywords(maybeArray.keywords_csv)
      };
    }
  }
  if (normalized.seo && typeof normalized.seo === "object") {
    return normalized.seo;
  }
  return maybeArray || normalized;
};

const extractContent = (data: any, fallbackTitle: string): BlogContent | null => {
  const normalized = normalizeResponse(data);
  if (!normalized) return null;

  if (Array.isArray(normalized)) {
    const firstBlog = normalized.find(item => item && typeof item.blog === "string");
    if (firstBlog && typeof firstBlog.blog === "string") {
      return { title: fallbackTitle, content: firstBlog.blog };
    }
  }

  if (typeof normalized === "string") {
    return { title: fallbackTitle, content: normalized };
  }

  if (normalized.blog && typeof normalized.blog === "string") {
    return { title: fallbackTitle, content: normalized.blog };
  }

  if (normalized.content && typeof normalized.content === "string") {
    return {
      title: normalized.title || fallbackTitle,
      content: normalized.content
    };
  }

  return null;
};

const renderRawResponse = (data: any) => {
  if (!data) return null;
  return (
    <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-950/70 border border-slate-800 p-4 text-xs text-slate-200">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

const BlogResearchForm = () => {
  const { user } = useAuth();
  const { createProject, updateProject, logActivity, logProductCreation, logProductCompletion, logProductError } = useProjects();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const requestInFlightRef = useRef(false);
  const [state, setState] = useState<BlogResearchState>(() => {
    const fallback: BlogResearchState = {
      step: BlogStep.TITLE,
      maxStep: BlogStep.TITLE,
      isLoading: false,
      topic: "",
      targetAudience: "",
      contentAngle: "",
      topics: [],
      titles: [],
      selectedTitle: "",
      selectedTopic: null,
      sectionTopic: "",
      sectionSegment: "",
      sectionGoal: "",
      sectionWordCount: 1500,
      sectionDetails: [],
      sectionOutlineText: "",
      sectionSources: [],
      sections: [],
      seo: null,
      content: null,
      projectId: null,
      responses: {}
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;

    try {
      const parsed = JSON.parse(saved) as BlogResearchState;
      const maxStep = getMaxStep(parsed);
      const selectedTopic = parsed.selectedTopic
        || parsed.topics?.find(topic => topic.title === parsed.selectedTitle)
        || null;
      return {
        ...fallback,
        ...parsed,
        sectionWordCount: parsed.sectionWordCount || fallback.sectionWordCount,
        sectionDetails: parsed.sectionDetails || fallback.sectionDetails,
        sectionOutlineText: parsed.sectionOutlineText || fallback.sectionOutlineText,
        sectionSources: parsed.sectionSources || fallback.sectionSources,
        selectedTopic,
        maxStep
      };
    } catch (error) {
      console.warn("Failed to parse saved blog research state:", error);
      return fallback;
    }
  });

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!user?.id) return;
      const result = await SubscriptionService.getCreditBalance(user.id);
      if (result.success && result.data) {
        setCreditBalance(result.data.balance);
      }
    };
    fetchCreditBalance();
  }, [user?.id]);

  useEffect(() => {
    if (state.step === BlogStep.SECTIONS && state.selectedTitle && !state.sectionTopic.trim()) {
      setState(prev => ({ ...prev, sectionTopic: prev.selectedTitle }));
    }
  }, [state.step, state.selectedTitle, state.sectionTopic]);

  const projectTitle = useMemo(() => {
    const label = state.selectedTitle || state.topic || "Blog Research";
    return `Blog Research: ${label.substring(0, 50)}${label.length > 50 ? "..." : ""}`;
  }, [state.selectedTitle, state.topic]);

  const handleReset = () => {
    const resetState: BlogResearchState = {
      step: BlogStep.TITLE,
      maxStep: BlogStep.TITLE,
      isLoading: false,
      topic: "",
      targetAudience: "",
      contentAngle: "",
      topics: [],
      titles: [],
      selectedTitle: "",
      selectedTopic: null,
      sectionTopic: "",
      sectionSegment: "",
      sectionGoal: "",
      sectionWordCount: 1500,
      sectionDetails: [],
      sectionOutlineText: "",
      sectionSources: [],
      sections: [],
      seo: null,
      content: null,
      projectId: null,
      responses: {}
    };
    localStorage.removeItem(STORAGE_KEY);
    setState(resetState);
  };

  const ensureAuthenticated = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform blog research.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const deductCredits = async (featureType: string, creditsNeeded: number, actionLabel: string) => {
    const creditCheck = await SubscriptionService.useCredits(user!.id, featureType, creditsNeeded);
    if (!creditCheck.success) {
      toast({
        title: "Credit Error",
        description: creditCheck.error || `Unable to process credits for ${actionLabel}.`,
        variant: "destructive"
      });
      return false;
    }
    setCreditBalance(prev => (typeof prev === "number" ? Math.max(0, prev - creditsNeeded) : prev));
    toast({
      title: "Credits Deducted",
      description: `${creditsNeeded} credits deducted for ${actionLabel}.`
    });
    return true;
  };

  const getStepCreditConfig = (step: BlogStep) => {
    switch (step) {
      case BlogStep.TITLE:
        return { cost: 12, label: "Title Generation" };
      case BlogStep.SECTIONS:
        return { cost: 24, label: "Section Generation" };
      case BlogStep.SEO:
        return { cost: 12, label: "SEO Generation" };
      case BlogStep.CONTENT:
        return { cost: 12, label: "Content Generation" };
      default:
        return { cost: 0, label: "Step" };
    }
  };

  const handleGenerateTitles = async () => {
    if (state.isLoading || requestInFlightRef.current) return;
    if (!state.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a blog topic before generating titles.",
        variant: "destructive"
      });
      return;
    }

    if (!ensureAuthenticated()) return;

    const creditsOk = await deductCredits("blog_title", 12, "title generation");
    if (!creditsOk) return;

    requestInFlightRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      let currentProjectId = state.projectId;
      if (!currentProjectId) {
        const projectResult = await createProject({
          title: projectTitle,
          type: "blog",
          status: "processing",
          project_metadata: {
            topic: state.topic.trim(),
            targetAudience: state.targetAudience.trim(),
            contentAngle: state.contentAngle.trim(),
            submittedAt: new Date().toISOString(),
            researchType: "blog"
          }
        });
        currentProjectId = projectResult.data?.id || null;
      }

      if (currentProjectId && !state.projectId) {
        setState(prev => ({ ...prev, projectId: currentProjectId }));
      }

      await logProductCreation("blog", projectTitle, {
        topic: state.topic.trim(),
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        step: "title"
      });

      const response = await generateBlogTitles({
        topic: state.topic.trim(),
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        userId: user!.id
      });

      const topics = extractTopics(response);
      const titles = topics.length
        ? topics.map(topic => topic.title)
        : extractStringList(response, ["titles", "headlines", "suggestions", "ideas"]);
      const selectedTopic = topics.find(topic => topic.title === (state.selectedTitle || titles[0])) || null;

      setState(prev => ({
        ...prev,
        isLoading: false,
        topics,
        titles,
        selectedTitle: prev.selectedTitle || titles[0] || "",
        selectedTopic,
        responses: { ...prev.responses, title: response },
        maxStep: Math.max(prev.maxStep, BlogStep.SECTIONS) as BlogStep
      }));

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          status: "processing",
          project_metadata: {
            topic: state.topic.trim(),
            targetAudience: state.targetAudience.trim(),
            contentAngle: state.contentAngle.trim(),
            titles,
            topics,
            selectedTitle: titles[0] || "",
            titleResponse: response
          }
        });
      }

      await logActivity({
        action: "Generated blog titles",
        details: `Generated ${titles.length} title ideas`,
        activity_metadata: {
          step: "title",
          titlesCount: titles.length
        }
      });

      toast({
        title: "Titles Generated",
        description: titles.length ? "Pick a title to continue." : "Response received. Review the output to continue."
      });
    } catch (error) {
      console.error("Error generating titles:", error);
      await logProductError("blog", error instanceof Error ? error.message : "Unknown error", state.projectId || undefined, {
        topic: state.topic.trim(),
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        step: "title"
      });
      toast({
        title: "Title Generation Failed",
        description: "We could not generate titles. Please try again.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      requestInFlightRef.current = false;
    }
  };

  const handleGenerateSections = async () => {
    if (state.isLoading || requestInFlightRef.current) return;
    if (!state.selectedTitle) {
      toast({
        title: "Title Required",
        description: "Please select a title before generating sections.",
        variant: "destructive"
      });
      return;
    }

    if (!state.sectionTopic.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the section generator.",
        variant: "destructive"
      });
      return;
    }

    if (!ensureAuthenticated()) return;

    const creditsOk = await deductCredits("blog_sections", 24, "section generation");
    if (!creditsOk) return;

    requestInFlightRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await generateBlogSections({
        topic: state.sectionTopic.trim(),
        title: state.selectedTitle,
        segment: state.sectionSegment.trim(),
        goal: state.sectionGoal.trim(),
        "word count": state.sectionWordCount,
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        userId: user!.id
      });

      const sectionDetails = extractSections(response);
      const sectionSources = extractSectionSources(response);
      const sections = sectionDetails.length
        ? sectionDetails.map(section => section.section_name)
        : extractStringList(response, ["sections", "outline", "headings", "structure"]);
      const sectionOutlineText = sections.join("\n");

      setState(prev => ({
        ...prev,
        isLoading: false,
        sectionDetails,
        sectionOutlineText,
        sectionSources,
        sections,
        responses: { ...prev.responses, sections: response },
        maxStep: Math.max(prev.maxStep, BlogStep.SEO) as BlogStep
      }));

      if (state.projectId) {
        await updateProject(state.projectId, {
          status: "processing",
          project_metadata: {
            topic: state.topic.trim(),
            targetAudience: state.targetAudience.trim(),
            contentAngle: state.contentAngle.trim(),
            title: state.selectedTitle,
            sectionConfig: {
              topic: state.sectionTopic.trim(),
              segment: state.sectionSegment.trim(),
              goal: state.sectionGoal.trim(),
              wordCount: state.sectionWordCount
            },
            sectionDetails,
            sectionSources,
            sections,
            sectionOutlineText,
            sectionsResponse: response
          }
        });
      }

      await logActivity({
        action: "Generated blog sections",
        details: `Generated ${sections.length} sections`,
        activity_metadata: {
          step: "sections",
          sectionsCount: sections.length
        }
      });

      toast({
        title: "Sections Generated",
        description: sections.length ? "Review your outline and continue." : "Sections received. Review the response."
      });
    } catch (error) {
      console.error("Error generating sections:", error);
      await logProductError("blog", error instanceof Error ? error.message : "Unknown error", state.projectId || undefined, {
        topic: state.topic.trim(),
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        step: "sections"
      });
      toast({
        title: "Section Generation Failed",
        description: "We could not generate sections. Please try again.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      requestInFlightRef.current = false;
    }
  };

  const handleGenerateSeo = async () => {
    if (state.isLoading || requestInFlightRef.current) return;
    if (!state.selectedTitle) {
      toast({
        title: "Title Required",
        description: "Please select a title before generating SEO.",
        variant: "destructive"
      });
      return;
    }

    if (!ensureAuthenticated()) return;

    const creditsOk = await deductCredits("blog_seo", 12, "SEO generation");
    if (!creditsOk) return;

    requestInFlightRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const normalizedSections = normalizeOutlineToSections(state.sectionOutlineText);
      const sectionsDetailed = normalizedSections.map(sectionName => {
        const match = state.sectionDetails.find(section => section.section_name === sectionName);
        return {
          section_name: sectionName,
          section_word_count: match?.section_word_count,
          overview_idea: match?.overview_idea
        };
      });
      const response = await generateBlogSeo({
        topic: state.topic.trim(),
        title: state.selectedTitle,
        editableTitle: state.sectionTopic.trim(),
        sections: sectionsDetailed,
        sectionsOutline: normalizedSections,
        sources: state.sectionSources,
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        userId: user!.id
      });

      const seo = extractSeo(response);

      setState(prev => ({
        ...prev,
        isLoading: false,
        seo,
        responses: { ...prev.responses, seo: response },
        maxStep: Math.max(prev.maxStep, BlogStep.CONTENT) as BlogStep
      }));

      if (state.projectId) {
        await updateProject(state.projectId, {
          status: "processing",
          project_metadata: {
            topic: state.topic.trim(),
            targetAudience: state.targetAudience.trim(),
            contentAngle: state.contentAngle.trim(),
            title: state.selectedTitle,
            sectionConfig: {
              topic: state.sectionTopic.trim(),
              segment: state.sectionSegment.trim(),
              goal: state.sectionGoal.trim(),
              wordCount: state.sectionWordCount
            },
            sectionDetails: state.sectionDetails,
            sectionSources: state.sectionSources,
            sections: normalizeOutlineToSections(state.sectionOutlineText),
            seo,
            seoResponse: response
          }
        });
      }

      await logActivity({
        action: "Generated blog SEO",
        details: "Generated SEO recommendations",
        activity_metadata: {
          step: "seo"
        }
      });

      toast({
        title: "SEO Generated",
        description: "SEO recommendations are ready."
      });
    } catch (error) {
      console.error("Error generating SEO:", error);
      await logProductError("blog", error instanceof Error ? error.message : "Unknown error", state.projectId || undefined, {
        topic: state.topic.trim(),
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        step: "seo"
      });
      toast({
        title: "SEO Generation Failed",
        description: "We could not generate SEO details. Please try again.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      requestInFlightRef.current = false;
    }
  };

  const handleGenerateContent = async () => {
    if (state.isLoading || requestInFlightRef.current) return;
    if (!state.selectedTitle) {
      toast({
        title: "Title Required",
        description: "Please select a title before generating content.",
        variant: "destructive"
      });
      return;
    }

    if (!ensureAuthenticated()) return;

    const creditsOk = await deductCredits("blog_content", 12, "content generation");
    if (!creditsOk) return;

    requestInFlightRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const normalizedSections = normalizeOutlineToSections(state.sectionOutlineText);
      const response = await generateBlogContent({
        topic: state.topic.trim(),
        title: state.selectedTitle,
        sections: normalizedSections,
        seo: state.seo,
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        userId: user!.id
      });

      const content = extractContent(response, state.selectedTitle || state.topic);
      if (!content) {
        throw new Error("No content returned from webhook");
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        content,
        responses: { ...prev.responses, content: response },
        maxStep: BlogStep.CONTENT
      }));

      if (state.projectId) {
        await updateProject(state.projectId, {
          status: "completed",
          project_metadata: {
            topic: state.topic.trim(),
            targetAudience: state.targetAudience.trim(),
            contentAngle: state.contentAngle.trim(),
            title: state.selectedTitle,
            selectedTopic: state.selectedTopic,
            sectionConfig: {
              topic: state.sectionTopic.trim(),
              segment: state.sectionSegment.trim(),
              goal: state.sectionGoal.trim(),
              wordCount: state.sectionWordCount
            },
            sectionDetails: state.sectionDetails,
            sectionSources: state.sectionSources,
            sections: normalizeOutlineToSections(state.sectionOutlineText),
            seo: state.seo,
            content,
            responses: {
              title: state.responses.title,
              sections: state.responses.sections,
              seo: state.responses.seo,
              content: response
            },
            completedAt: new Date().toISOString()
          }
        });
      }

      await logProductCompletion("blog", projectTitle, state.projectId || undefined);
      await SubscriptionService.trackUsage(user!.id, "blog", 1);

      await logActivity({
        action: "Generated blog content",
        details: "Generated final blog content",
        activity_metadata: {
          step: "content"
        }
      });

      toast({
        title: "Content Generated",
        description: "Your blog content is ready."
      });
    } catch (error) {
      console.error("Error generating content:", error);
      await logProductError("blog", error instanceof Error ? error.message : "Unknown error", state.projectId || undefined, {
        topic: state.topic.trim(),
        targetAudience: state.targetAudience.trim(),
        contentAngle: state.contentAngle.trim(),
        step: "content"
      });
      toast({
        title: "Content Generation Failed",
        description: "We could not generate the full content. Please try again.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      requestInFlightRef.current = false;
    }
  };

  const blogResponse = state.content
    ? [{ output: { title: state.content.title, content: state.content.content } }]
    : null;

  const sectionsText = state.sectionOutlineText;
  const seoEntries = Array.isArray(state.seo) ? state.seo : state.seo ? [state.seo] : [];
  const primarySeoEntry = seoEntries[0] || null;
  const seoHasStructuredFields = Boolean(
    primarySeoEntry && (
      Array.isArray(primarySeoEntry.keywords) ||
      primarySeoEntry.metaTitle ||
      primarySeoEntry.metaDescription ||
      primarySeoEntry.slug ||
      primarySeoEntry.primary_keyword
    )
  );

  return (
    <BlogLayout
      currentStep={state.step}
      maxStep={state.maxStep}
      onStepChange={(step) => setState(prev => ({ ...prev, step }))}
      onReset={handleReset}
    >
      {state.step === BlogStep.TITLE && (
        <div className="space-y-6">
          {creditBalance !== null && (
            <CreditDisplay
              balance={creditBalance}
              stepCost={getStepCreditConfig(BlogStep.TITLE).cost}
              stepName={getStepCreditConfig(BlogStep.TITLE).label}
            />
          )}
          <Card className="bg-slate-900/70 border-slate-800 p-6">
            <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Blog topic or prompt</Label>
              <Textarea
                placeholder="Enter your blog topic, audience, and angle..."
                value={state.topic}
                onChange={(event) => setState(prev => ({ ...prev, topic: event.target.value }))}
                className="bg-slate-950/60 border-slate-700 text-slate-100 min-h-[120px]"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Target audience</Label>
                <Textarea
                  placeholder="Who is this for?"
                  value={state.targetAudience}
                  onChange={(event) => setState(prev => ({ ...prev, targetAudience: event.target.value }))}
                  className="bg-slate-950/60 border-slate-700 text-slate-100 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Content angle</Label>
                <Textarea
                  placeholder="What angle should we take?"
                  value={state.contentAngle}
                  onChange={(event) => setState(prev => ({ ...prev, contentAngle: event.target.value }))}
                  className="bg-slate-950/60 border-slate-700 text-slate-100 min-h-[80px]"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateTitles}
              disabled={state.isLoading || !state.topic.trim() || !state.targetAudience.trim() || !state.contentAngle.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Titles...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Titles
                </>
              )}
            </Button>

            {state.titles.length > 0 && (
              <div className="space-y-3 pt-4">
                <Label className="text-slate-200">Select a title</Label>
                <div className="grid gap-2">
                  {(state.topics.length ? state.topics : state.titles.map(title => ({ title }))).map((topic, index) => {
                    const title = topic.title;
                    const isActive = state.selectedTitle === title;
                    return (
                      <button
                        key={`${title}-${index}`}
                        onClick={() => setState(prev => ({
                          ...prev,
                          selectedTitle: title,
                          selectedTopic: "difficultyScore" in topic ? (topic as BlogTopic) : null,
                          sectionTopic: !prev.sectionTopic || prev.sectionTopic === prev.selectedTitle ? title : prev.sectionTopic
                        }))}
                        className={`w-full text-left px-4 py-4 rounded-lg border transition-all ${isActive
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                          : "border-slate-700 bg-slate-950/40 text-slate-200 hover:border-slate-500"
                          }`}
                      >
                        <div className="text-sm font-medium">{title}</div>
                        {"difficultyScore" in topic && (
                          <div className="mt-3 space-y-2 text-xs text-slate-300">
                            <div className="flex flex-wrap gap-2">
                              {typeof topic.difficultyScore === "number" && (
                                <span className="rounded-full border border-slate-700 px-2 py-1">
                                  Difficulty: {topic.difficultyScore}
                                </span>
                              )}
                              {topic.searchVolumeTier && (
                                <span className="rounded-full border border-slate-700 px-2 py-1">
                                  Volume: {topic.searchVolumeTier}
                                </span>
                              )}
                              {Array.isArray(topic.powerWordsUsed) && topic.powerWordsUsed.length > 0 && (
                                <span className="rounded-full border border-emerald-500/30 px-2 py-1 text-emerald-200">
                                  Power words: {topic.powerWordsUsed.join(", ")}
                                </span>
                              )}
                            </div>
                            {topic.targetAudience && (
                              <div>
                                <span className="text-slate-400">Audience:</span> {topic.targetAudience}
                              </div>
                            )}
                            {topic.searchIntent && (
                              <div>
                                <span className="text-slate-400">Intent:</span> {topic.searchIntent}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({ ...prev, step: BlogStep.SECTIONS }))}
                    disabled={!state.selectedTitle}
                    className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                  >
                    Continue to Sections
                  </Button>
                </div>
              </div>
            )}

            {!state.titles.length && renderRawResponse(state.responses.title)}
            </div>
          </Card>
        </div>
      )}

      {state.step === BlogStep.SECTIONS && (
        <div className="space-y-6">
          {creditBalance !== null && (
            <CreditDisplay
              balance={creditBalance}
              stepCost={getStepCreditConfig(BlogStep.SECTIONS).cost}
              stepName={getStepCreditConfig(BlogStep.SECTIONS).label}
            />
          )}
          <Card className="bg-slate-900/70 border-slate-800 p-6">
            <div className="space-y-4">
            <div className="text-sm text-slate-300">
              Selected title: <span className="text-emerald-300 font-medium">{state.selectedTitle || "None"}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-200">Title (editable)</Label>
                <Textarea
                  placeholder="Selected title will load here"
                  value={state.sectionTopic}
                  onChange={(event) => setState(prev => ({ ...prev, sectionTopic: event.target.value }))}
                  className="bg-slate-950/60 border-slate-700 text-slate-100 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Segment</Label>
                <Input
                  placeholder="e.g. Startups"
                  value={state.sectionSegment}
                  onChange={(event) => setState(prev => ({ ...prev, sectionSegment: event.target.value }))}
                  className="bg-slate-950/60 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Goal</Label>
                <Input
                  placeholder="e.g. Customer acquisition"
                  value={state.sectionGoal}
                  onChange={(event) => setState(prev => ({ ...prev, sectionGoal: event.target.value }))}
                  className="bg-slate-950/60 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label className="text-slate-200">Word count</Label>
                <Input
                  type="number"
                  min={300}
                  step={50}
                  value={state.sectionWordCount}
                  onChange={(event) => setState(prev => ({ ...prev, sectionWordCount: Number(event.target.value) }))}
                  className="bg-slate-950/60 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateSections}
              disabled={state.isLoading || !state.selectedTitle || !state.sectionTopic.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Sections...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sections
                </>
              )}
            </Button>

            {state.sectionDetails.length > 0 && (
              <div className="space-y-3 pt-2">
                <Label className="text-slate-200">Generated sections</Label>
                <div className="grid gap-3">
                  {state.sectionDetails.map((section, index) => (
                    <div
                      key={`${section.section_name}-${index}`}
                      className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-emerald-200">{section.section_name}</span>
                        {typeof section.section_word_count === "number" && (
                          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                            {section.section_word_count} words
                          </span>
                        )}
                      </div>
                      {section.overview_idea && (
                        <p className="mt-2 text-xs text-slate-300">{section.overview_idea}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.sectionSources.length > 0 && (
              <div className="space-y-3 pt-4">
                <Label className="text-slate-200">Sources</Label>
                <div className="grid gap-2">
                  {state.sectionSources.map((source, index) => (
                    <div
                      key={`${source.url}-${index}`}
                      className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-200"
                    >
                      <div className="truncate text-emerald-200">{source.url}</div>
                      {source.reason && (
                        <div className="mt-1 text-slate-300">{source.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.sections.length > 0 && (
              <div className="space-y-2 pt-4">
                <Label className="text-slate-200">Outline (editable)</Label>
                <Textarea
                  value={sectionsText}
                  onChange={(event) => {
                    const outline = event.target.value;
                    setState(prev => ({
                      ...prev,
                      sectionOutlineText: outline,
                      sections: normalizeOutlineToSections(outline)
                    }));
                  }}
                  className="bg-slate-950/60 border-slate-700 text-slate-100 min-h-[180px]"
                />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({ ...prev, step: BlogStep.SEO }))}
                    className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                  >
                    Continue to SEO
                  </Button>
                </div>
              </div>
            )}

            {!state.sections.length && renderRawResponse(state.responses.sections)}
            </div>
          </Card>
        </div>
      )}

      {state.step === BlogStep.SEO && (
        <div className="space-y-6">
          {creditBalance !== null && (
            <CreditDisplay
              balance={creditBalance}
              stepCost={getStepCreditConfig(BlogStep.SEO).cost}
              stepName={getStepCreditConfig(BlogStep.SEO).label}
            />
          )}
          <Card className="bg-slate-900/70 border-slate-800 p-6">
            <div className="space-y-4">
            <Button
              onClick={handleGenerateSeo}
              disabled={state.isLoading || !state.selectedTitle}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating SEO...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate SEO
                </>
              )}
            </Button>

            {state.seo && (
              <div className="space-y-4 pt-4 text-sm text-slate-200">
                {Array.isArray(primarySeoEntry?.keywords) && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Keywords</Label>
                    <div className="flex flex-wrap gap-2">
                      {primarySeoEntry.keywords.map((keyword: string, index: number) => (
                        <span
                          key={`${keyword}-${index}`}
                          className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {primarySeoEntry?.metaTitle && (
                  <div>
                    <Label className="text-slate-300">Meta title</Label>
                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      {primarySeoEntry.metaTitle}
                    </div>
                  </div>
                )}

                {primarySeoEntry?.metaDescription && (
                  <div>
                    <Label className="text-slate-300">Meta description</Label>
                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      {primarySeoEntry.metaDescription}
                    </div>
                  </div>
                )}

                {primarySeoEntry?.primary_keyword && (
                  <div>
                    <Label className="text-slate-300">Primary keyword</Label>
                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      {primarySeoEntry.primary_keyword}
                    </div>
                  </div>
                )}

                {primarySeoEntry?.slug && (
                  <div>
                    <Label className="text-slate-300">Slug</Label>
                    <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                      {primarySeoEntry.slug}
                    </div>
                  </div>
                )}
                {!seoHasStructuredFields && renderRawResponse(state.responses.seo)}
              </div>
            )}

            {!state.seo && renderRawResponse(state.responses.seo)}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, step: BlogStep.CONTENT }))}
                  className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                >
                  Continue to Content
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {state.step === BlogStep.CONTENT && (
        <div className="space-y-6">
          {creditBalance !== null && (
            <CreditDisplay
              balance={creditBalance}
              stepCost={getStepCreditConfig(BlogStep.CONTENT).cost}
              stepName={getStepCreditConfig(BlogStep.CONTENT).label}
            />
          )}
          <Card className="bg-slate-900/70 border-slate-800 p-6">
            <div className="space-y-4">
              <Button
                onClick={handleGenerateContent}
                disabled={state.isLoading || !state.selectedTitle}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Complete Content
                  </>
                )}
              </Button>
            </div>
          </Card>

          {blogResponse && <BlogPostDisplay response={blogResponse} />}
          {!blogResponse && renderRawResponse(state.responses.content)}
        </div>
      )}
    </BlogLayout>
  );
};

export default BlogResearchForm;
