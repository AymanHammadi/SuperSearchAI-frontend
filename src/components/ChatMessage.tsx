import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { User, Bot, CheckCircle } from "lucide-react";
import { SearchResult } from "./SearchResult";

export type MessageType = "user" | "system" | "question" | "answer" | "result";

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

  const getIcon = () => {
    if (isUser) return <User className="h-4 w-4" />;
    if (isSystem || isQuestion) return <Bot className="h-4 w-4" />;
    if (isAnswer) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Bot className="h-4 w-4" />;
  };

  const getAlignment = () => {
    return isUser ? "flex-row-reverse" : "flex-row";
  };

  const getMessageStyles = () => {
    if (isUser) {
      return "bg-primary text-primary-foreground ml-12";
    }
    if (isSystem) {
      return "bg-muted mr-12";
    }
    if (isQuestion) {
      return "bg-blue-50 border-blue-200 mr-12";
    }
    if (isAnswer) {
      return "bg-green-50 border-green-200 mr-12";
    }
    if (isResult) {
      return "bg-background border mr-12";
    }
    return "bg-muted mr-12";
  };

  const renderResultCard = () => {
    if (!isResult || !message.data) return null;

    const data = message.data;
    return (
      <div className="mt-3">
        <SearchResult
          title={data.title as string}
          url={data.url as string}
          content={data.content as string}
          source={data.source as string}
          score={data.score as number}
          image={data.image as string}
          search_query={data.search_query as string}
        />
      </div>
    );
  };

  return (
    <div className={cn("flex gap-3 mb-4", getAlignment(), className)}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <Card className={cn("", getMessageStyles())}>
          <CardContent className="p-4">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap m-0">{message.content}</p>
            </div>
            
            {/* Render choices for questions */}
            {isQuestion && message.choices && message.choices.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.choices.map((choice, index) => (
                  <Button
                    key={index}
                    variant={message.selectedChoice === choice ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChoiceSelect?.(message.id, choice)}
                    disabled={message.selectedChoice !== undefined}
                    className="w-full justify-start text-left"
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
                  className="w-full justify-start text-left text-muted-foreground"
                >
                  Skip this question
                </Button>
              </div>
            )}

            {/* Render result card */}
            {renderResultCard()}
          </CardContent>
        </Card>
        <div className="text-xs text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
