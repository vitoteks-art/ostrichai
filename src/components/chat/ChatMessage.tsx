import React from 'react';
import { ChatMessage as ChatMessageType } from '@/services/chatbotService';
import { UserMessage } from './UserMessage';
import { BotMessage } from './BotMessage';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.isUser) {
    return <UserMessage message={message} />;
  }

  return <BotMessage message={message} />;
};
