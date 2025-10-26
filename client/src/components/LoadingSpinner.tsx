import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  subtitle?: string;
}

export default function LoadingSpinner({ message = 'Loading...', subtitle }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Sparkles className="w-8 h-8 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-lg font-semibold text-primary mb-2" data-testid="text-loading-message">
          {message}
        </p>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
