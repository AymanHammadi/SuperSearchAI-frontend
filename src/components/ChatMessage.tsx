import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { User, Bot, CheckCircle } from "lucide-react";
import { SearchResultsDisplay } from "./SearchResultsDisplay";
import { LoadingMessage } from "./LoadingMessage";

export type MessageType = "user" | "system" | "question" | "answer" | "result" | "loading";

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  choices?: string[];
  selectedChoice?: string;
  data?: Record<string, unknown>;
}

interface ChatMessageProps {
  message: ChatMessage;
  onChoiceSelect?: (messageId: string, choice: string) => void;
  className?: string;
}

export function ChatMessage({ message, onChoiceSelect, className }: ChatMessageProps) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";
  const isQuestion = message.type === "question";
  const isAnswer = message.type === "answer";
  const isResult = message.type === "result";
  const isLoading = message.type === "loading";

  // Handle loading messages with special component
  if (isLoading) {
    return <LoadingMessage message={message.content} className={className} />;
  }

  const getIcon = () => {
    if (isUser) return <User className="h-4 w-4" />;
    if (isSystem || isQuestion) return <Bot className="h-4 w-4" />;
    if (isAnswer) return <CheckCircle className="h-4 w-4 text-success" />;
    return <Bot className="h-4 w-4" />;
  };

  const getAlignment = () => {
    return isUser ? "flex-row-reverse" : "flex-row";
  };

  const getMessageStyles = () => {
    if (isUser) {
      return "bg-secondary text-white ml-16 shadow-sm";
    }
    if (isSystem) {
      return "bg-surface-50 border border-surface-300 mr-16 shadow-sm";
    }
    if (isQuestion) {
      return "bg-primary-50 border border-primary-200 mr-16 shadow-sm";
    }
    if (isAnswer) {
      return "bg-success-50 border border-success-200 mr-16 shadow-sm";
    }
    if (isResult) {
      return "bg-transparent border-0 mr-0 p-0"; 
    }
    return "bg-surface-50 border border-surface-300 mr-16 shadow-sm";
  };

  const renderResultCard = () => {
    

    if (isResult && message.data) {
      const data = message.data;
      return (
        <SearchResultsDisplay
          report={data.report as { title: string; answer: string }}
          images={data.images as string[]}
          resources={data.resources as Array<{ title: string; url: string }>}
          userDetails={data.userDetails as string}
        />
      );
    }

    return null;
  };

  return (
    <div className={cn("flex gap-4 mb-6", getAlignment(), className)}>
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-surface-50 border-2 border-surface-300 flex items-center justify-center shadow-sm">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        {isResult ? (
          // For comprehensive results, render without the card wrapper
          <div>
            {renderResultCard()}
            <div className="text-xs text-neutral-500 mt-3 px-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <>
            <Card className={cn("", getMessageStyles())}>
              <CardContent className="p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap m-0 text-sm leading-relaxed">{message.content}</p>
                </div>
                
                {/* Render choices for questions */}
                {isQuestion && message.choices && message.choices.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {message.choices.map((choice, index) => (
                      <Button
                        key={index}
                        variant={message.selectedChoice === choice ? "default" : "outline"}
                        size="sm"
                        onClick={() => onChoiceSelect?.(message.id, choice)}
                        disabled={message.selectedChoice !== undefined}
                        className="w-full justify-start text-left transition-all duration-200 hover:shadow-sm"
                      >
                        {choice}
                      </Button>
                    ))}
                    {/*  Skip option */}
                    <Button
                      variant={message.selectedChoice === "Skip" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onChoiceSelect?.(message.id, "Skip")}
                      disabled={message.selectedChoice !== undefined}
                      className="w-full justify-start text-left text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
                    >
                      Skip this question
                    </Button>
                  </div>
                )}

                {/* Render result card */}
                {renderResultCard()}
              </CardContent>
            </Card>
            <div className="text-xs text-neutral-500 mt-2 px-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
