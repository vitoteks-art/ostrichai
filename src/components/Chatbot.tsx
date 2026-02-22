import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { chatbotService, ChatMessage as ChatMessageType } from '@/services/chatbotService';

interface ChatbotProps {
  className?: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus input after bot messages are added
  useEffect(() => {
    if (isOpen && inputRef.current && messages.length > 1) {
      // Check if the last message is from bot (not user)
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('📤 Sending message to webhook...');
      const response = await chatbotService.sendMessage(userMessage.content);

      console.log('📥 Received response:', response);

      if (response.conversationId) {
        console.log('🆔 Conversation ID:', response.conversationId);
      }

      const botMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: response.success
          ? chatbotService.formatMessage(response.message!)
          : 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    // Reset conversation ID for new chat session
    chatbotService.resetConversation();
    console.log('🆔 Chat cleared and conversation reset');
  };

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      {/* Chat Toggle Button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-all duration-200",
          "bg-primary hover:bg-primary/90"
        )}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Custom Chat Modal */}
      {isOpen && (
        <div
          className={cn(
            "fixed w-full sm:w-[400px] p-0 flex flex-col max-h-[80vh] z-50",
            "bg-background border border-border shadow-2xl",
            "animate-in slide-in-from-right duration-300",
            "right-0 top-[50%] translate-y-[-50%] translate-x-0",
            "sm:right-0 sm:top-auto sm:bottom-24 sm:translate-y-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  OstrichAi Assistant
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                    aria-label="Minimize chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8"
                    aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div
                  className="flex-1 p-4 min-h-0 h-full overflow-y-auto"
                  ref={scrollAreaRef}
                  onScroll={(e) => {
                    e.stopPropagation();
                  }}
                  onWheel={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // Handle scrolling manually
                    const target = e.currentTarget as HTMLDivElement;
                    target.scrollTop += e.deltaY;
                  }}
                  onTouchMove={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgb(156 163 175) transparent'
                  }}
                >
                  <div className="space-y-1 pr-2">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-sm text-muted-foreground">Typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background/50">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={isLoading}
                      aria-label="Type your message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="h-10 w-10"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
           )}
         </div>
      )}

      {/* Minimized Chat Indicator */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={() => setIsMinimized(false)}
            className="h-12 px-4 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            aria-label="Restore chat"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      )}
    </div>
  );
};
