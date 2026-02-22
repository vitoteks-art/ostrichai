import { Link } from "react-router-dom";
import { Video, Sparkles, Github, Twitter, Mail, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: "/", label: "Home" },
    { path: "/user-guide", label: "User Guide" },
    { path: "/revenue-audit", label: "Revenue Audit" },
    { path: "/image-creative", label: "Image Creative" },
    { path: "/ads-creative", label: "Ads Creative" },
    { path: "/flyer-designer", label: "Flyer Designer" },
    { path: "/contact", label: "Contact" },
    { path: "/privacy-policy", label: "Privacy Policy" },
    { path: "/sitemap.xml", label: "Sitemap" },
  ];

  const tools = [
    { path: "/two-image-editor", label: "Image Editor" },
    { path: "/batch-results", label: "Batch Results" },
    { path: "/status", label: "Video Status" },
  ];

  return (
    <footer className="bg-card/80 backdrop-blur-xl border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/ostrich-logo.png"
                alt="OstrichAi"
                className="h-32 w-auto min-w-[280px] object-contain -ml-8"
              />
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              Transform your creative vision into reality with our AI-powered suite of tools.
              Create stunning videos, images, and advertisements in minutes.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  {link.path === "/sitemap.xml" ? (
                    <a
                      href={link.path}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Tools</h3>
            <ul className="space-y-3">
              {tools.map((tool) => (
                <li key={tool.path}>
                  <Link
                    to={tool.path}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} OstrichAi. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
