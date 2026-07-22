import { SiX, SiTelegram } from "react-icons/si";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#060606] mt-auto">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25"
            data-testid="text-footer-copyright"
          >
            © {new Date().getFullYear()} DeFiJerusalem — Security Intelligence
          </span>

          <div className="flex items-center gap-1 flex-wrap">
            <a
              href="mailto:partnerships@defijerusalem.com"
              className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 hover:text-white/65 transition-colors"
              data-testid="link-partnerships-email"
            >
              <Mail className="w-3.5 h-3.5" />
              Partnerships
            </a>

            <a
              href="https://twitter.com/defi_jerusalem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 hover:text-white/65 transition-colors"
              data-testid="link-twitter"
            >
              <SiX className="w-3.5 h-3.5" />
              @defi_jerusalem
            </a>

            <a
              href="https://t.me/gibbie03"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 hover:text-white/65 transition-colors"
              data-testid="link-telegram"
            >
              <SiTelegram className="w-3.5 h-3.5" />
              Telegram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
