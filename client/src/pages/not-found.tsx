import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* 404 display */}
        <p className="font-display font-black text-[clamp(6rem,20vw,14rem)] leading-none text-white/5 select-none">
          404
        </p>

        <div className="space-y-2 -mt-4">
          <h1 className="text-sm font-black tracking-[0.25em] uppercase text-white/60">
            Page Not Found
          </h1>
          <p className="text-xs text-white/30 tracking-wider max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link href="/">
          <button className="inline-flex items-center gap-2 border border-[#E8C15A]/40 text-[#E8C15A]/80 hover:bg-[#E8C15A]/10 hover:text-[#E8C15A] transition-colors px-6 py-2.5 text-[11px] font-black tracking-[0.2em] uppercase">
            <ArrowLeft className="w-3.5 h-3.5" />
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
