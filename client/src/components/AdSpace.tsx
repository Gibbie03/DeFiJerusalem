interface AdSpaceProps {
  position: 'top' | 'bottom';
}

export default function AdSpace({ position }: AdSpaceProps) {
  return (
    <div 
      className="bg-muted/30 border border-dashed border-border flex items-center justify-center min-h-[100px] rounded-md"
      data-testid={`ad-space-${position}`}
    >
      <div className="text-center p-4">
        <p className="text-sm text-muted-foreground font-medium">Advertisement Space ({position})</p>
        <p className="text-xs text-muted-foreground mt-1">Your ad could be here</p>
      </div>
    </div>
  );
}
