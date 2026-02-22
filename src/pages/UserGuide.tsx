import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import userGuide from "../../docs/user-guide.md?raw";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const getHeadingText = (children: React.ReactNode): string => {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map((child) => getHeadingText(child)).join("");
  }
  if (React.isValidElement(children)) {
    return getHeadingText(children.props.children);
  }
  return "";
};

const UserGuide = () => {
  const { intro, sections, tableOfContents } = useMemo(() => {
    const items: { level: number; text: string; id: string }[] = [];
    const parsedSections: { title: string; content: string; id: string }[] = [];
    const parts = userGuide.split(/^##\s+/m);
    const introBlock = parts.shift() || "";

    parts.forEach((part) => {
      const [rawTitle, ...rest] = part.split("\n");
      const title = rawTitle.trim();
      const content = rest.join("\n").trim();
      if (!title) return;
      const id = slugify(title);
      parsedSections.push({ title, content, id });
      items.push({ level: 2, text: title, id });

      const subHeadingRegex = /^(#{3,4})\s+(.*)$/gm;
      let match: RegExpExecArray | null;
      while ((match = subHeadingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        if (!text) continue;
        items.push({ level, text, id: slugify(text) });
      }
    });

    return {
      intro: introBlock.trim(),
      sections: parsedSections,
      tableOfContents: items,
    };
  }, []);

  return (
    <Layout>
      <SEO
        title="User Guide | OstrichAi Studio"
        description="Learn how to use OstrichAi Studio from signup to exporting results across videos, logos, ads, and more."
      />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <BookOpen className="h-4 w-4" />
            <span>User Guide</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-foreground">How to use the app</h1>
          <p className="mt-2 text-muted-foreground">
            Step-by-step instructions for every major feature, from login to exporting results.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/contact">Need help?</Link>
            </Button>
            <Button asChild>
              <Link to="/pricing">
                View plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="lg:sticky lg:top-24 h-fit">
            <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border/50">
              <div className="text-sm font-semibold text-foreground mb-3">Contents</div>
              <nav className="space-y-2 text-sm">
                {tableOfContents
                  .filter((item) => item.level >= 2 && item.level <= 4)
                  .map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-muted-foreground hover:text-foreground transition-colors ${item.level === 3 ? "pl-3" : item.level === 4 ? "pl-5" : ""}`}
                    >
                      {item.text}
                    </a>
                  ))}
              </nav>
            </Card>
          </aside>

          <div className="space-y-6">
            {intro && (
              <Card className="p-6 md:p-10 bg-card/80 backdrop-blur-xl border border-border/50">
                <article className="prose prose-slate max-w-none text-base md:text-lg prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-headings:font-semibold prose-h1:text-4xl md:prose-h1:text-5xl prose-h2:text-3xl md:prose-h2:text-4xl prose-h3:text-2xl md:prose-h3:text-3xl prose-h4:text-xl md:prose-h4:text-2xl prose-li:marker:text-muted-foreground prose-headings:scroll-mt-24 prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2 prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:text-foreground prose-blockquote:py-2 prose-blockquote:px-4 prose-hr:border-border/60">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {intro}
                  </ReactMarkdown>
                </article>
              </Card>
            )}

            {sections.map((section) => (
              <Card key={section.id} className="p-6 md:p-10 bg-card/80 backdrop-blur-xl border border-border/50">
                <article className="prose prose-slate max-w-none text-base md:text-lg prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-headings:font-semibold prose-h1:text-4xl md:prose-h1:text-5xl prose-h2:text-3xl md:prose-h2:text-4xl prose-h3:text-2xl md:prose-h3:text-3xl prose-h4:text-xl md:prose-h4:text-2xl prose-li:marker:text-muted-foreground prose-headings:scroll-mt-24 prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2 prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:text-foreground prose-blockquote:py-2 prose-blockquote:px-4 prose-hr:border-border/60">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children }) => {
                        const text = getHeadingText(children);
                        const id = slugify(text);
                        return <h2 id={id}>{children}</h2>;
                      },
                      h3: ({ children }) => {
                        const text = getHeadingText(children);
                        const id = slugify(text);
                        return <h3 id={id}>{children}</h3>;
                      },
                      h4: ({ children }) => {
                        const text = getHeadingText(children);
                        const id = slugify(text);
                        return <h4 id={id}>{children}</h4>;
                      },
                    }}
                  >
                    {`## ${section.title}\n\n${section.content}`}
                  </ReactMarkdown>
                </article>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserGuide;
