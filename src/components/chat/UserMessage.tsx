import React from 'react';
import { ChatMessage as ChatMessageType } from '@/services/chatbotService';
import { cn } from '@/lib/utils';

interface UserMessageProps {
  message: ChatMessageType;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-end mb-4 animate-in slide-in-from-right duration-300">
      <div className="max-w-[80%] sm:max-w-[70%] lg:max-w-[60%]">
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl shadow-sm",
            "bg-primary text-primary-foreground",
            "rounded-br-md" // Remove bottom-right corner for chat bubble effect
          )}
          role="article"
          aria-label={`Your message: ${message.content}`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Timestamp */}
          <div className="text-xs opacity-70 mt-2 text-right">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
