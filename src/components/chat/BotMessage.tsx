import React from 'react';
import { ChatMessage as ChatMessageType } from '@/services/chatbotService';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BotMessageProps {
  message: ChatMessageType;
}

export const BotMessage: React.FC<BotMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-start mb-4 animate-in slide-in-from-left duration-300">
      <div className="max-w-[80%] sm:max-w-[70%] lg:max-w-[60%]">
        {/* Bot Avatar */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-primary/10 border border-primary/20 shadow-sm"
            )}
            aria-hidden="true"
          >
            <Filter className="w-5 h-5 text-primary" />
          </div>

          <div
            className={cn(
              "relative px-4 py-3 rounded-2xl shadow-sm",
              "bg-card border border-border/50",
              "rounded-bl-md text-foreground"
            )}
            role="article"
            aria-label={`Chatbot response: ${message.content.substring(0, 100)}...`}
          >
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-primary">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-muted-foreground">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-2">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Timestamp */}
            <div className="text-xs opacity-70 mt-2 text-left">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
