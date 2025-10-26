interface AdSpaceProps {
  position: 'top' | 'bottom';
}

export default function AdSpace({ position }: AdSpaceProps) {
  return (
    <div 
      className="w-full bg-muted/20 border-y border-border py-4"
      data-testid={`ad-space-${position}`}
    >
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Google AdSense Ad Unit - Replace this section with your AdSense code */}
        <div 
          className="flex items-center justify-center min-h-[90px] lg:min-h-[120px] bg-background/50 rounded-md border border-dashed border-muted-foreground/20"
          style={{ maxWidth: '970px', margin: '0 auto' }}
        >
          {/* 
            INSERT YOUR GOOGLE ADSENSE CODE HERE
            
            Recommended ad sizes:
            - Leaderboard: 728x90 (desktop)
            - Large Leaderboard: 970x90 (large screens)
            - Responsive Horizontal (best option)
            
            Example AdSense code structure:
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"
                 data-ad-format="horizontal"
                 data-full-width-responsive="true">
            </ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
          */}
          
          {/* Placeholder - Remove when adding real ads */}
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground font-medium">
              AdSense Ad Space ({position})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              970x90 / Responsive Horizontal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
