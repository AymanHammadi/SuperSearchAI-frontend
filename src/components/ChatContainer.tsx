import { useEffect, useRef } from "react";
import { ChatMessage, type ChatMessage as ChatMessageType } from "./ChatMessage";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Bot, Send } from "lucide-react";

interface ChatContainerProps {
  messages: ChatMessageType[];
  onChoiceSelect?: (messageId: string, choice: string) => void;
  showSubmitButton?: boolean;
  onSubmitAnswers?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatContainer({ 
  messages, 
  onChoiceSelect, 
  showSubmitButton = false,
  onSubmitAnswers,
  isLoading = false,
  className 
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Welcome to Super Search AI
              </h3>
              <p className="text-muted-foreground">
                Start by typing your query below. I'll ask clarification questions to provide better results.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onChoiceSelect={onChoiceSelect}
              />
            ))}
            
            {/* Submit Button */}
            {showSubmitButton && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={onSubmitAnswers}
                  disabled={isLoading}
                  size="lg"
                  className="px-8"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? "Processing..." : "Submit Answers"}
                </Button>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
