import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { EmailCampaignService } from '../services/emailCampaignService';
import { WysiwygEditor } from './WysiwygEditor';
import { COMMON_EMAIL_VARIABLES } from '../types/email';
import {
  Eye,
  Code,
  Save,
  Send,
  Mail,
} from 'lucide-react';

interface EmailComposerProps {
  initialSubject?: string;
  initialContent?: string;
  onSave?: (subject: string, content: string) => void;
  onSend?: (subject: string, content: string) => void;
  className?: string;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  initialSubject = '',
  initialContent = '',
  onSave,
  onSend,
  className,
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const { toast } = useToast();


  const previewEmail = () => {
    // Process variables for preview
    const processedContent = EmailCampaignService.processTemplateVariables(content, []);
    const processedSubject = EmailCampaignService.processTemplateVariables(subject, []);

    // Open preview in new window/tab
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Email Preview</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${processedSubject}</h1>
              <div style="color: #555; line-height: 1.6;">
                ${processedContent.replace(/\n/g, '<br>')}
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                This is a preview of your email. Variables have been processed with sample data.
              </p>
            </div>
          </body>
        </html>
      `);
    }
  };

  return (
    <Card className={`${className} border-gray-300 bg-white shadow-sm`}>
      <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Mail className="w-5 h-5 text-blue-600" />
          Email Composer
        </CardTitle>
        <CardDescription className="text-gray-600">
          Create and edit email content with rich formatting and RTL support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 bg-white pt-6">
        {/* Subject Line */}
        <div className="space-y-2">
          <Label htmlFor="email-subject" className="text-gray-900 font-medium">Subject Line</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            className="border-gray-300 text-gray-900 bg-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <Label htmlFor="email-content" className="text-gray-900 font-medium">Email Content</Label>
          <WysiwygEditor
            value={content}
            onChange={setContent}
            placeholder="Compose your email content..."
            height="400px"
            variables={COMMON_EMAIL_VARIABLES.map(v => ({
              key: v.key,
              label: v.label,
              value: v.defaultValue
            }))}
            onVariableInsert={(variable) => {
              toast({
                title: 'Variable Inserted',
                description: `${variable} variable added to content`,
              });
            }}
            className="border-gray-300"
            direction="ltr"
          />
        </div>


        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-300">
          <Button
            variant="outline"
            onClick={previewEmail}
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>

          {onSave && (
            <Button
              variant="outline"
              onClick={() => onSave(subject, content)}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
          )}

          {onSend && (
            <Button
              onClick={() => onSend(subject, content)}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              Send Email
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
