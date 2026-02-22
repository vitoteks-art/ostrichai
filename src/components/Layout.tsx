import { ReactNode } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { Chatbot } from "./Chatbot";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout = ({ children, className = "" }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40 relative overflow-hidden flex flex-col">
      {/* Enhanced Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-accent/10 to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-secondary/15 rounded-full blur-2xl" />
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-accent/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '6s' }} />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <Navigation />
      
      <main className={`relative z-10 flex-1 pt-16 ${className}`}>
        {children}
      </main>

      <Footer />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default Layout;
