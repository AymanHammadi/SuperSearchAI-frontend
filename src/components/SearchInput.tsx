import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LLMProvider } from "@/lib/apiKeys";
import { providerLabels, hasApiKey } from "@/lib/apiKeys";

export type SearchMode = "quick" | "deep";

interface SearchInputProps {
  onSearch: (query: string, provider: LLMProvider, mode: SearchMode) => void;
  onProviderChange: (provider: LLMProvider) => void;
  onOpenApiKeyModal: () => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({
  onSearch,
  onProviderChange,
  onOpenApiKeyModal,
  isLoading = false,
  className,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<LLMProvider>("openrouter");
  const [mode, setMode] = useState<SearchMode>("quick");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onProviderChange(provider);
  }, [provider, onProviderChange]);

  const handleSubmit = () => {
    if (!query.trim()) return;
    
    // Check if API key exists for selected provider
    if (!hasApiKey(provider)) {
      onOpenApiKeyModal();
      return;
    }
    
    onSearch(query.trim(), provider, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="bg-background border rounded-2xl p-4 shadow-lg">
        <div className="space-y-4">
          {/* Main input area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="min-h-[30px] max-h-[200px] resize-none border-0 bg-transparent p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
              style={{ height: "auto" }}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={provider} onValueChange={(value: LLMProvider) => setProvider(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(providerLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {label}
                        {!hasApiKey(key as LLMProvider) && (
                          <Settings className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={mode} onValueChange={(value: SearchMode) => setMode(value)}>
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="w-full sm:w-auto h-9 px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
