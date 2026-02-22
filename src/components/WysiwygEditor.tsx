import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Table,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Palette,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Code as CodeIcon,
  Save,
  X,
  Check,
} from 'lucide-react';

interface WysiwygEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  showToolbar?: boolean;
  variables?: Array<{ key: string; label: string; value?: string }>;
  onVariableInsert?: (variable: string) => void;
  direction?: 'ltr' | 'rtl';
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  className = '',
  height = '400px',
  showToolbar = true,
  variables = [],
  onVariableInsert,
  direction = 'ltr',
}) => {
  const [content, setContent] = useState(value);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>(direction);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const { toast } = useToast();

  // Update content when value prop changes from outside
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      // Only update if the content is different and we're not in the middle of typing
      if (editorRef.current.innerHTML !== value) {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const startOffset = range?.startOffset;
        const endOffset = range?.endOffset;
        const startContainer = range?.startContainer;
        
        editorRef.current.innerHTML = value;
        setContent(value);
        
        // Restore cursor position if possible
        if (range && startContainer && editorRef.current.contains(startContainer)) {
          try {
            const newRange = document.createRange();
            newRange.setStart(startContainer, Math.min(startOffset || 0, startContainer.textContent?.length || 0));
            newRange.setEnd(startContainer, Math.min(endOffset || 0, startContainer.textContent?.length || 0));
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          } catch (e) {
            // If cursor restoration fails, just continue
          }
        }
      }
    }
    isInternalUpdate.current = false;
  }, [value]);
  
  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Notify parent of content changes
  const handleContentChange = useCallback((newContent: string) => {
    isInternalUpdate.current = true;
    setContent(newContent);
    onChange?.(newContent);
  }, [onChange]);

  // Execute editor commands
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();

    // Get updated content
    const updatedContent = editorRef.current?.innerHTML || '';
    handleContentChange(updatedContent);
  }, [handleContentChange]);

  // Format text
  const formatText = useCallback((command: string, value?: string) => {
    executeCommand(command, value);
  }, [executeCommand]);

  // Insert element
  const insertElement = useCallback((element: string) => {
    let html = '';

    switch (element) {
      case 'table':
        html = `
          <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 1</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 2</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Col 1</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Col 2</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Col 3</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Col 1</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Col 2</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Col 3</td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      case 'image':
        html = `<img src="https://via.placeholder.com/600x300?text=Your+Image" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        break;
      case 'blockquote':
        html = `<blockquote style="border-left: 4px solid #007bff; padding-left: 16px; margin: 20px 0; color: #555; font-style: italic;">Your quote here...</blockquote>`;
        break;
      case 'code':
        html = `<pre style="background-color: #f4f4f4; padding: 16px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', monospace;"><code>// Your code here\nconsole.log('Hello, World!');</code></pre>`;
        break;
      case 'hr':
        html = `<hr style="border: none; border-top: 2px solid #eee; margin: 20px 0;" />`;
        break;
      default:
        return;
    }

    // Insert HTML at cursor position
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const fragment = document.createDocumentFragment();

      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      range.insertNode(fragment);

      // Update content
      const updatedContent = editorRef.current?.innerHTML || '';
      handleContentChange(updatedContent);
    }
  }, [handleContentChange]);

  // Insert link
  const insertLink = useCallback(() => {
    if (!linkUrl) return;

    const selection = window.getSelection();
    if (selection?.toString()) {
      executeCommand('createLink', linkUrl);
    } else {
      executeCommand('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`);
    }

    setLinkUrl('');
    setIsLinkDialogOpen(false);
  }, [linkUrl, executeCommand]);

  // Insert variable
  const insertVariable = useCallback((variableKey: string) => {
    const variableTag = `{{${variableKey}}}`;
    executeCommand('insertHTML', `<span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; color: #1976d2;" contenteditable="false">${variableTag}</span>`);

    toast({
      title: 'Variable Inserted',
      description: `${variableKey} variable added to content`,
    });

    onVariableInsert?.(variableKey);
  }, [executeCommand, toast, onVariableInsert]);

  // Get selected text
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    setSelectedText(selection?.toString() || '');
  }, []);

  // Handle paste to clean HTML
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    executeCommand('insertText', text);
  }, [executeCommand]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            executeCommand('redo');
          } else {
            e.preventDefault();
            executeCommand('undo');
          }
          break;
      }
    }
  }, [formatText, executeCommand]);

  // Toggle text direction
  const toggleDirection = useCallback(() => {
    const newDirection = textDirection === 'ltr' ? 'rtl' : 'ltr';
    setTextDirection(newDirection);
    if (editorRef.current) {
      editorRef.current.style.direction = newDirection;
      editorRef.current.style.textAlign = newDirection === 'rtl' ? 'right' : 'left';
    }
  }, [textDirection]);

  // Toolbar component with proper contrast
  const Toolbar = () => (
    <div className="border-b border-gray-300 p-3 flex flex-wrap items-center gap-1 bg-white">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('bold')}
          title="Bold (Ctrl+B)"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('italic')}
          title="Italic (Ctrl+I)"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('underline')}
          title="Underline (Ctrl+U)"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('strikeThrough')}
          title="Strikethrough"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('formatBlock', 'h1')}
          title="Heading 1"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('formatBlock', 'h2')}
          title="Heading 2"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('formatBlock', 'h3')}
          title="Heading 3"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Heading3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('justifyLeft')}
          title="Align Left"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('justifyCenter')}
          title="Align Center"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('justifyRight')}
          title="Align Right"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('justifyFull')}
          title="Justify"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('insertUnorderedList')}
          title="Bullet List"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => formatText('insertOrderedList')}
          title="Numbered List"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      {/* Elements */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsLinkDialogOpen(true)}
          title="Insert Link"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Link className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertElement('image')}
          title="Insert Image"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Image className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertElement('table')}
          title="Insert Table"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Table className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertElement('blockquote')}
          title="Insert Quote"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertElement('code')}
          title="Insert Code Block"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Code className="w-4 h-4" />
        </Button>
      </div>

      {/* History */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => executeCommand('undo')}
          title="Undo (Ctrl+Z)"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => executeCommand('redo')}
          title="Redo (Ctrl+Shift+Z)"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Direction */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleDirection}
          title={`Switch to ${textDirection === 'ltr' ? 'RTL' : 'LTR'}`}
          className="hover:bg-gray-100 text-gray-700 hover:text-black font-semibold"
        >
          {textDirection === 'ltr' ? 'LTR' : 'RTL'}
        </Button>
      </div>

      {/* View Options */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowHtml(!showHtml)}
          title="Toggle HTML View"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          <CodeIcon className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title="Toggle Fullscreen"
          className="hover:bg-gray-100 text-gray-700 hover:text-black"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50 bg-white' : 'bg-white border-gray-300'}`}>
      <CardContent className="p-0 bg-white">
        {/* Toolbar */}
        {showToolbar && <Toolbar />}

        {/* Variables Panel */}
        {variables.length > 0 && (
          <div className="border-b border-gray-300 p-3 bg-blue-50">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm font-medium text-gray-800">Variables:</Label>
              {variables.map((variable) => (
                <Badge
                  key={variable.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 text-blue-700 border-blue-300 bg-white"
                  onClick={() => insertVariable(variable.key)}
                  title={variable.label}
                >
                  {`{{${variable.key}}}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="relative bg-white">
          {showHtml ? (
            // HTML Source Editor
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 font-mono text-sm border-none resize-none focus:outline-none text-gray-900 bg-white"
              style={{ height, direction: textDirection }}
              spellCheck={false}
            />
          ) : (
            // WYSIWYG Editor
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 wysiwyg-editor text-gray-900 bg-white"
              style={{
                height,
                overflow: 'auto',
                direction: textDirection,
                textAlign: textDirection === 'rtl' ? 'right' : 'left'
              }}
              onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
              onSelect={handleSelection}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              data-placeholder={placeholder}
            />
          )}
        </div>

        {/* Link Dialog */}
        {isLinkDialogOpen && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-10 min-w-80">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-900">Insert Link</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsLinkDialogOpen(false)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-url" className="text-sm text-gray-700">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="border-gray-300 text-gray-900 bg-white focus:border-blue-500 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      insertLink();
                    }
                  }}
                />
              </div>

              {selectedText && (
                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  Link text: "{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsLinkDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Insert
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Character/Word Count */}
        <div className="border-t border-gray-300 p-3 bg-white text-sm text-gray-700 flex justify-between items-center">
          <div className="font-medium">
            Characters: <span className="text-gray-900">{content.length}</span> | Words: <span className="text-gray-900">{content.split(/\s+/).filter(word => word.length > 0).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              {textDirection.toUpperCase()}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHtml(!showHtml)}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {showHtml ? 'Preview' : 'HTML'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
