import { SiX, SiTelegram } from "react-icons/si";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
            © {new Date().getFullYear()} JERUSALEM DeFi Security Scanner
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href="mailto:partnerships@defijerusalem.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-1.5 rounded-md"
              data-testid="link-partnerships-email"
            >
              <Mail className="w-4 h-4" />
              <span>Partnerships</span>
            </a>
            
            <a
              href="https://twitter.com/defi_jerusalem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-1.5 rounded-md"
              data-testid="link-twitter"
            >
              <SiX className="w-4 h-4" />
              <span>@defi_jerusalem</span>
            </a>
            
            <a
              href="https://t.me/gibbie03"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-1.5 rounded-md"
              data-testid="link-telegram"
            >
              <SiTelegram className="w-4 h-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
