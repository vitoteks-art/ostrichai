export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatbotResponse {
  success: boolean;
  message?: string;
  error?: string;
  conversationId?: string;
}

class ChatbotService {
  private readonly webhookUrl = 'https://n8n.getostrichai.com/webhook/chat-bt';
  private conversationId: string | null = null;

  // Generate a unique conversation ID
  private generateConversationId(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `conv_${timestamp}_${randomStr}`;
  }

  // Get or create conversation ID
  private getConversationId(): string {
    if (!this.conversationId) {
      this.conversationId = this.generateConversationId();
      console.log('🆔 New conversation ID generated:', this.conversationId);
    }
    return this.conversationId;
  }

  async sendMessage(message: string): Promise<ChatbotResponse> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          conversationId: this.getConversationId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response text first
      const textResponse = await response.text();

      // Log the raw response for debugging
      console.log('🔍 Raw webhook response:', textResponse);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      // Try to parse as JSON, but handle plain text responses too
      let data: any;
      try {
        data = textResponse ? JSON.parse(textResponse) : {};
        console.log('📦 Parsed JSON data:', data);
      } catch (parseError) {
        // If JSON parsing fails, treat the response as plain text
        console.log('📝 Response is not JSON, treating as text:', textResponse);
        return {
          success: true,
          message: textResponse || 'Message received successfully!',
          conversationId: this.getConversationId(),
        };
      }

      // Handle different possible response formats from n8n
      const botMessage =
        data.message ||
        data.response ||
        data.output ||
        data.text ||
        data.reply ||
        data.content ||
        data.answer ||
        (typeof data === 'string' ? data : null);

      // If still no message found, log the structure and return the whole data
      if (!botMessage) {
        console.warn('⚠️ No message found in expected fields. Full data structure:', data);
        console.warn('💡 Expected fields: message, response, output, text, reply, content, answer');

        // Try to extract any string value from the response
        const stringValues = Object.entries(data)
          .filter(([_, value]) => typeof value === 'string' && value.trim())
          .map(([key, value]) => `${key}: ${value}`);

        if (stringValues.length > 0) {
          console.log('📋 Found string values:', stringValues);
          return {
            success: true,
            message: stringValues[0].split(': ')[1], // Use the first string value found
          };
        }

        // If no string values found, check for nested objects
        const nestedStrings = Object.entries(data)
          .filter(([_, value]) => typeof value === 'object' && value !== null)
          .map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return Object.entries(value)
                .filter(([_, v]) => typeof v === 'string' && v.trim())
                .map(([k, v]) => `${key}.${k}: ${v}`);
            }
            return [];
          })
          .flat();

        if (nestedStrings.length > 0) {
          console.log('🔍 Found nested string values:', nestedStrings);
          return {
            success: true,
            message: nestedStrings[0].split(': ')[1], // Use the first nested string value found
          };
        }

        return {
          success: true,
          message: JSON.stringify(data, null, 2), // Show the whole response as formatted JSON
        };
      }

      console.log('✅ Bot message extracted:', botMessage);

      return {
        success: true,
        message: botMessage,
        conversationId: this.getConversationId(),
      };
    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        conversationId: this.getConversationId(),
      };
    }
  }

  // Helper method to format messages for display
  formatMessage(content: string): string {
    // Basic formatting - can be extended based on n8n response format
    return content.trim();
  }

  // Get current conversation ID
  getCurrentConversationId(): string | null {
    return this.conversationId;
  }

  // Reset conversation (for new chat sessions)
  resetConversation(): void {
    this.conversationId = null;
    console.log('🔄 Conversation reset');
  }
}

export const chatbotService = new ChatbotService();
