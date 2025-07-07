import { useState, useCallback } from 'react';
import axios from 'axios';
import { ProgressSteps, type Step } from './components/ProgressSteps';
import { SearchInput,  } from './components/SearchInput';
import { ChatContainer } from './components/ChatContainer';
import { ApiKeyModal } from './components/ApiKeyModal';
import SettingsModal from './components/SettingsModal';
import type { ChatMessage } from './components/ChatMessage';
import type { LLMProvider } from './lib/apiKeys';
import { getApiKey } from './lib/apiKeys';
import { Button } from './components/ui/button';
import { Settings } from 'lucide-react';

interface ClarificationQuestion {
  question_id: string;
  text: string;
  choices: string[];
}

interface SearchResultItem {
  title: string;
  url: string;
  content: string;
  score: number;
  image: string;
  search_query: string;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>("query");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>("openrouter");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<ClarificationQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const [showSubmitButton, setShowSubmitButton] = useState(false);


  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const pollForResults = useCallback(async (sessionId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/results/${sessionId}`);
      
      console.log('Polling response:', response.data);
      
      if (response.data.status === 'completed' && response.data.search_results) {
        setCurrentStep("results");
        setIsLoading(false);
        
        // Show search completion message with user details if available
        if (response.data.user_details) {
          addMessage({
            type: "system",
            content: `Search completed based on your answers:\n${response.data.user_details}`,
          });
        }

        // Show generated report if available
        if (response.data.report) {
          addMessage({
            type: "system",
            content: response.data.report,
          });
        }

        // Display search results
        if (response.data.search_results && response.data.search_results.length > 0) {
          const resultCount = response.data.search_results.length;
          
          addMessage({
            type: "system",
            content: `Found ${resultCount} relevant sources:`,
          });

          // Add each result as a separate message
          response.data.search_results.forEach((result: SearchResultItem) => {
            addMessage({
              type: "result",
              content: result.content || result.title,
              data: {
                title: result.title,
                url: result.url,
                source: new URL(result.url).hostname,
                content: result.content,
                score: result.score,
                image: result.image,
                search_query: result.search_query,
              },
            });
          });
        } else {
          addMessage({
            type: "system",
            content: "No search results found for your query. Try adjusting your search terms.",
          });
        }
      } else if (response.data.error) {
        setIsLoading(false);
        addMessage({
          type: "system",
          content: `Search error: ${response.data.error}`,
        });
      } else {
        // Still processing, poll again after 3 seconds
        setTimeout(() => pollForResults(sessionId), 3000);
      }
    } catch (error) {
      console.error('Error polling for results:', error);
      setIsLoading(false);
      addMessage({
        type: "system",
        content: "Error retrieving results. Please try again.",
      });
    }
  }, [addMessage]);

  const handleSearch = async (query: string, provider: LLMProvider) => {
    setIsLoading(true);
    setCurrentStep("query");
    
    // Clear previous session data
    setCurrentSessionId(null);
    setPendingQuestions([]);
    setAnsweredQuestions({});
    setShowSubmitButton(false);

    // Add user message
    addMessage({
      type: "user",
      content: query,
    });

    try {
      const apiKey = getApiKey(provider);
      
      if (!apiKey) {
        setIsApiKeyModalOpen(true);
        setIsLoading(false);
        return;
      }

      const payload = {
        query,
        LLM_PROVIDER: provider,
        LLM_API_KEY: apiKey,
      };

      

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await axios.post(`${apiUrl}/start/`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Store session data
      setCurrentSessionId(response.data.session_id);
      setPendingQuestions(response.data.clarification);
      
      // Move to questions step
      setCurrentStep("questions");
      
      // Add system message about clarification with progress indicator
      const totalQuestions = response.data.clarification.length;
      addMessage({
        type: "system",
        content: `I need to ask ${totalQuestions} clarification questions to provide better results. You can answer them individually or skip any you prefer.`,
      });

      // Add clarification questions as messages with proper question mapping
      response.data.clarification.forEach((question: ClarificationQuestion) => {
        addMessage({
          type: "question",
          content: question.text,
          choices: question.choices,
          data: { question_id: question.question_id },
        });
      });

      setIsLoading(false);

    } catch (error) {
      console.error('Error starting search:', error);
      setIsLoading(false);
      
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
        
        // Log detailed validation errors
        if (error.response?.data?.detail) {
          console.error('Validation errors:', error.response.data.detail);
          error.response.data.detail.forEach((err: unknown, index: number) => {
            console.error(`Error ${index + 1}:`, err);
          });
        }
        
        // Handle specific backend signals
        if (error.response?.data?.signal === 'no_related_questions') {
          addMessage({
            type: "system",
            content: "I couldn't generate clarification questions for this query. Let me proceed with a direct search instead.",
          });
          
          return;
        }
      }
      
      addMessage({
        type: "system",
        content: "Sorry, there was an error starting your search. Please try again.",
      });
    }
  };

  const handleChoiceSelect = (messageId: string, choice: string) => {
    // Update the message with selected choice and handle the question logic
    setMessages(prev => {
      const updatedMessages = prev.map(msg => 
        msg.id === messageId ? { ...msg, selectedChoice: choice } : msg
      );
      
      // Find the question this choice belongs to
      const questionMessage = updatedMessages.find(msg => msg.id === messageId);
      if (questionMessage && questionMessage.data) {
        const questionId = questionMessage.data.question_id as string;
        const question = pendingQuestions.find(q => q.question_id === questionId);
        if (question) {
          // Update answered questions
          setAnsweredQuestions(prev => {
            const newAnsweredQuestions = {
              ...prev,
              [question.question_id]: choice,
            };
            
            // Show submit button if we have at least one answer
            const hasAnswers = Object.keys(newAnsweredQuestions).length > 0;
            setShowSubmitButton(hasAnswers);
            
            return newAnsweredQuestions;
          });
        }
      }
      
      return updatedMessages;
    });
  };

  const handleSubmitAnswers = async () => {
    if (!currentSessionId) return;

    // Submit answers
    setCurrentStep("answers");
    setIsLoading(true);
    setShowSubmitButton(false);
    
    // Add summary of answers
    const answeredCount = Object.keys(answeredQuestions).length;
    const skippedCount = pendingQuestions.length - answeredCount;
    
    addMessage({
      type: "system",
      content: `Submitting ${answeredCount} answers${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}. Processing your search...`,
    });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Format answers according to the backend schema
      const answers = pendingQuestions.map(q => ({
        question_id: q.question_id,
        choice: answeredQuestions[q.question_id] || "Skip"
      }));

      // Get the original query from the first user message
      const originalQuery = messages.find(msg => msg.type === "user")?.content || "";

      const payload = {
        session_id: currentSessionId,
        search_mode: "quick",
        query: originalQuery,
        answers,
      };

      console.log('Sending search payload:', payload);

      const response = await axios.post(`${apiUrl}/search`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Search response:', response.data);
      console.log('Response status field:', response.data.status);
      console.log('Response keys:', Object.keys(response.data));

      // Move to results step
      setCurrentStep("results");
      setIsLoading(false);
      
      // Check if search was completed successfully
      if (response.data.status === "completed") {
        // This shouldn't happen with current backend, but handle it just in case
        setIsLoading(false);
        addMessage({
          type: "system",
          content: "Search completed immediately - this is unexpected. Please check results.",
        });
      } else if (response.data.status === "started_search") {
        // Search started, need to poll for results
        addMessage({
          type: "system",
          content: "Search started successfully! Please wait while we process your query...",
        });
        
        // Start polling for results
        pollForResults(response.data.session_id);
      } else {
        // Handle error cases
        const errorMessage = response.data.error || "Search could not be completed.";
        setIsLoading(false);
        addMessage({
          type: "system",
          content: `Search error: ${errorMessage}`,
        });
      }

    } catch (error) {
      console.error('Error submitting search:', error);
      setIsLoading(false);
      setShowSubmitButton(true);
      
      if (axios.isAxiosError(error)) {
        console.error('Search error response:', error.response?.data);
        console.error('Search error status:', error.response?.status);
      }
      
      addMessage({
        type: "system",
        content: "Error processing your search. Please try again.",
      });
    }
  };

  const handleApiKeySave = () => {
    // API key is already saved in the modal component
  };

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      {/* Settings Button - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSettingsModalOpen(true)}
          className="shadow-warm backdrop-blur-sm border-2"
          title="API Key Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="border-b-2 border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-sm">
        <ProgressSteps currentStep={currentStep} />
      </div>

      {/* Chat Container */}
      <ChatContainer
        messages={messages}
        onChoiceSelect={handleChoiceSelect}
        showSubmitButton={showSubmitButton}
        onSubmitAnswers={handleSubmitAnswers}
        isLoading={isLoading}
        className="flex-1"
      />

      {/* Search Input */}
      <div className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 p-3 border-t-2 border-border shadow-warm-lg">
        <SearchInput
          onSearch={handleSearch}
          onProviderChange={setSelectedProvider}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          isLoading={isLoading}
        />
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        provider={selectedProvider}
        onSave={handleApiKeySave}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

export default App;