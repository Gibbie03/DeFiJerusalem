interface LoadingSpinnerProps {
  message?: string;
  subtitle?: string;
}

export default function LoadingSpinner({ message = 'Loading...', subtitle }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Animated crosshair */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border border-[#E8C15A]/30 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 border border-[#E8C15A]/15" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#E8C15A]/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#E8C15A]/20" />
          <div className="absolute inset-[30%] bg-[#E8C15A] animate-pulse" />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-black tracking-[0.25em] uppercase text-white/60" data-testid="text-loading-message">
            {message}
          </p>
          {subtitle && (
            <p className="text-[10px] text-white/25 tracking-wider">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
