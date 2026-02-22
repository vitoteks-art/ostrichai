export enum BlogStep {
  TITLE = 1,
  SECTIONS = 2,
  SEO = 3,
  CONTENT = 4
}

export interface BlogContent {
  title: string;
  content: string;
}

export type BlogSeo = Record<string, any>;

export interface BlogTopic {
  title: string;
  difficultyScore?: number;
  searchVolumeTier?: string;
  targetAudience?: string;
  searchIntent?: string;
  powerWordsUsed?: string[];
}

export interface BlogSection {
  section_name: string;
  section_word_count?: number;
  overview_idea?: string;
}

export interface BlogSectionSource {
  url: string;
  reason?: string;
}

export interface BlogResearchState {
  step: BlogStep;
  maxStep: BlogStep;
  isLoading: boolean;
  topic: string;
  targetAudience: string;
  contentAngle: string;
  topics: BlogTopic[];
  titles: string[];
  selectedTitle: string;
  selectedTopic: BlogTopic | null;
  sectionTopic: string;
  sectionSegment: string;
  sectionGoal: string;
  sectionWordCount: number;
  sectionDetails: BlogSection[];
  sectionOutlineText: string;
  sectionSources: BlogSectionSource[];
  sections: string[];
  seo: BlogSeo | null;
  content: BlogContent | null;
  projectId?: string | null;
  responses: {
    title?: any;
    sections?: any;
    seo?: any;
    content?: any;
  };
}
