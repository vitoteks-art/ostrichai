import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Input } from "./input";
import { X } from "lucide-react";

export interface EmailInputProps {
  value?: string[];
  onChange?: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxEmails?: number;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const EmailInput = React.forwardRef<HTMLDivElement, EmailInputProps>(
  ({ value = [], onChange, placeholder = "Enter email addresses...", className, disabled, maxEmails, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Common email domains for auto-complete
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
      'aol.com', 'protonmail.com', 'mail.com', 'yandex.com', 'zoho.com'
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Show suggestions if user is typing an email
      if (newValue.includes('@')) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      const trimmedInput = inputValue.trim();

      // Handle Enter, Tab, or Comma to add email
      if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && trimmedInput) {
        e.preventDefault();
        addEmail(trimmedInput);
      }

      // Handle Backspace to remove last email
      if (e.key === 'Backspace' && !trimmedInput && value.length > 0) {
        e.preventDefault();
        removeEmail(value.length - 1);
      }

      // Handle Escape to hide suggestions
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    const addEmail = (email: string) => {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !isValidEmail(trimmedEmail)) return;

      if (maxEmails && value.length >= maxEmails) return;

      if (!value.includes(trimmedEmail)) {
        const newEmails = [...value, trimmedEmail];
        onChange?.(newEmails);
        setInputValue("");
      }
    };

    const removeEmail = (index: number) => {
      const newEmails = value.filter((_, i) => i !== index);
      onChange?.(newEmails);
    };

    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    const handleInputBlur = () => {
      setIsFocused(false);
      // Add email on blur if there's input
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    };

    const handleInputFocus = () => {
      setIsFocused(true);
    };

    // Handle click outside to hide suggestions
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
          setIsFocused(false);
        }
      };

      if (showSuggestions) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showSuggestions]);

    // Generate email suggestions based on input
    const getSuggestions = () => {
      if (!inputValue.includes('@') || !showSuggestions) return [];

      const [localPart, domainPart] = inputValue.split('@');
      if (!domainPart) {
        // Suggest common domains
        return commonDomains.slice(0, 5).map(domain => `${localPart}@${domain}`);
      } else {
        // Suggest completions for the current domain
        const matchingDomains = commonDomains.filter(domain =>
          domain.startsWith(domainPart)
        );
        return matchingDomains.slice(0, 5).map(domain => `${localPart}@${domain}`);
      }
    };

    const suggestions = getSuggestions();

    const handleSuggestionClick = (suggestion: string) => {
      addEmail(suggestion);
      setShowSuggestions(false);
    };

    return (
      <div
        ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          containerRef.current = node;
        }}
        className={cn(
          "relative min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isFocused && "ring-2 ring-ring ring-offset-2",
          className
        )}
        onClick={handleContainerClick}
        {...props}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {value.map((email, index) => {
            const isValid = isValidEmail(email);
            return (
              <Badge
                key={index}
                variant="secondary"
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs",
                  isValid
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                )}
              >
                {email}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEmail(index);
                    }}
                    className={cn(
                      "ml-1 rounded-full p-0.5",
                      isValid ? "hover:bg-blue-300" : "hover:bg-red-300"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}

          {!disabled && (
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              placeholder={value.length === 0 ? placeholder : ""}
              className="border-0 p-0 h-auto min-w-32 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground"
              disabled={maxEmails ? value.length >= maxEmails : false}
            />
          )}
        </div>

        {maxEmails && value.length >= maxEmails && (
          <p className="text-xs text-muted-foreground mt-1">
            Maximum of {maxEmails} emails allowed
          </p>
        )}

        {/* Email suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Validation summary and help */}
        <div className="mt-1 space-y-1">
          {value.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {(() => {
                const validCount = value.filter(email => isValidEmail(email)).length;
                const invalidCount = value.length - validCount;
                return (
                  <span>
                    {validCount} valid
                    {invalidCount > 0 && (
                      <span className="text-red-600">, {invalidCount} invalid</span>
                    )}
                    {maxEmails && (
                      <span className="text-gray-500"> (max: {maxEmails})</span>
                    )}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Keyboard shortcuts help */}
          <div className="text-xs text-gray-500">
            💡 Press Enter, Tab, or comma to add • Backspace to remove • Esc to close suggestions
          </div>
        </div>
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";
