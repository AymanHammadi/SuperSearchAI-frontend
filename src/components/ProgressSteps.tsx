import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

export type Step = "query" | "questions" | "answers" | "results";

interface ProgressStepsProps {
  currentStep: Step;
  className?: string;
}

const steps: { key: Step; label: string; stepNumber: number }[] = [
  { key: "query", label: "Query", stepNumber: 1 },
  { key: "questions", label: "Questions", stepNumber: 2 },
  { key: "answers", label: "Answers", stepNumber: 3 },
  { key: "results", label: "Results", stepNumber: 4 },
];

export function ProgressSteps({ currentStep, className }: ProgressStepsProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={cn("w-full max-w-2xl mx-auto p-6", className)}>
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => (
          <div key={step.key} className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-300 border-2 shadow-sm",
                index <= currentStepIndex
                  ? "bg-primary text-primary-foreground border-primary shadow-warm"
                  : "bg-surface-100 text-muted-foreground border-border"
              )}
            >
              {step.stepNumber}
            </div>
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-300",
                index <= currentStepIndex
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <Progress value={progressValue} className="h-3 shadow-sm" />
    </div>
  );
}
