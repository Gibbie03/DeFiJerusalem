import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/Footer";
import { Menu, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lazy, Suspense, useEffect } from "react";
import { Link, useLocation } from "wouter";

// Eagerly loaded — these are the two first-paint pages
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy-loaded — code-split into separate chunks, fetched only when the route is visited
const NewDApps          = lazy(() => import("@/pages/NewDApps"));
const TrendingDApps     = lazy(() => import("@/pages/TrendingDApps"));
const Blacklist         = lazy(() => import("@/pages/Blacklist"));
const BlacklistDetails  = lazy(() => import("@/pages/BlacklistDetails"));
const ThreatsPage       = lazy(() => import("@/pages/ThreatsPage"));
const ThreatEncyclopedia= lazy(() => import("@/pages/ThreatEncyclopedia"));
const ThreatDetail      = lazy(() => import("@/pages/ThreatDetail"));
const SecurityMethodology=lazy(() => import("@/pages/SecurityMethodology"));
const SubmitProtocol    = lazy(() => import("@/pages/SubmitProtocol"));
const ProtocolDetail    = lazy(() => import("@/pages/ProtocolDetail"));
const Tutorials         = lazy(() => import("@/pages/Tutorials"));
const SponsorshipGuide  = lazy(() => import("@/pages/SponsorshipGuide"));
const AdminLogin        = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard    = lazy(() => import("@/pages/AdminDashboard"));
const ReportScam        = lazy(() => import("@/pages/ReportScam"));
const CommunityReports  = lazy(() => import("@/pages/CommunityReports"));
const BountiesPage      = lazy(() => import("@/pages/BountiesPage"));
const BugBountiesDirectory=lazy(()=> import("@/pages/BugBountiesDirectory"));
const AuditFirmsPage    = lazy(() => import("@/pages/AuditFirmsPage"));
const AuditFirmDetail   = lazy(() => import("@/pages/AuditFirmDetail"));
const AuditFirmRegister = lazy(() => import("@/pages/AuditFirmRegister"));
const ChatPage          = lazy(() => import("@/pages/ChatPage"));
const SharedChatPage    = lazy(() => import("@/pages/SharedChatPage"));
const CategoriesPage    = lazy(() => import("@/pages/CategoriesPage"));
const NotFound          = lazy(() => import("@/pages/not-found"));

function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
      onClick={toggleSidebar}
      data-testid="button-sidebar-toggle"
    >
      <Menu className="w-4 h-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

/* ── DeFiJerusalem official logo — Old City Plan SVG ─────────────── */
function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
    >
      <g transform="translate(28,28)">
        {/* Octagonal city-wall outline */}
        <path
          d="M20 8 H44 L56 20 V44 L44 56 H20 L8 44 V20 Z"
          fill="none"
          stroke="#E8C15A"
          strokeWidth="4"
        />
        {/* Inner courtyard square */}
        <rect x="24" y="24" width="16" height="16" fill="none" stroke="#E8C15A" strokeWidth="3" />
        {/* Centre keep */}
        <rect x="29" y="29" width="6" height="6" fill="#E8C15A" />
        {/* Cardinal gate towers */}
        <rect x="30" y="4"  width="4" height="8" fill="#E8C15A" />
        <rect x="30" y="52" width="4" height="8" fill="#E8C15A" />
        <rect x="4"  y="30" width="8" height="4" fill="#E8C15A" />
        <rect x="52" y="30" width="8" height="4" fill="#E8C15A" />
      </g>
    </svg>
  );
}

function DadaFAB() {
  const [location] = useLocation();
  // Hide on the chat page itself and shared chat views
  if (location === "/chat" || location.startsWith("/chat/share")) return null;
  return (
    <Link href="/chat">
      <button
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#E8C15A] hover:bg-[#f0cc6a] active:bg-[#d4ae4e] text-[#060606] px-4 py-3 text-[11px] font-black tracking-[0.15em] uppercase shadow-[0_0_24px_rgba(232,193,90,0.25)] hover:shadow-[0_0_32px_rgba(232,193,90,0.4)] transition-all duration-150"
        data-testid="button-chat-with-dada"
        aria-label="Chat with Dada the Defender"
      >
        <Bot className="w-4 h-4 shrink-0" />
        Chat with Dada
      </button>
    </Link>
  );
}

function Router() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex flex-col h-screen w-full bg-[#060606]">

        {/* ── Top Header ─────────────────────────────────────────────── */}
        <header className="border-b border-[#1a1a1a] bg-[#060606] z-50 shrink-0">
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5">

            {/* Logo */}
            <Link href="/home" className="flex items-center gap-3 group">
              <LogoIcon />
              <span className="text-[13px] font-bold tracking-[0.22em] text-white uppercase select-none">
                DeFiJerusalem
              </span>
            </Link>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 border border-white/12 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white/55 uppercase hover:border-white/25 hover:text-white/80 transition-colors cursor-default select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-gold-pulse" />
                LIVE FEED
              </div>
              <CustomSidebarTrigger />
            </div>

          </div>
        </header>

        {/* Main Container */}
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1">
              <Suspense fallback={<LoadingSpinner message="Loading" subtitle="Just a moment…" />}>
              <Switch>
                <Route path="/" component={LandingPage} />
                <Route path="/home" component={Dashboard} />
                <Route path="/new" component={NewDApps} />
                <Route path="/trending" component={TrendingDApps} />
                <Route path="/protocol/:id" component={ProtocolDetail} />
                <Route path="/blacklist/:id" component={BlacklistDetails} />
                <Route path="/blacklist" component={Blacklist} />
                <Route path="/threats/encyclopedia/:threatId" component={ThreatDetail} />
                <Route path="/threats/encyclopedia" component={ThreatEncyclopedia} />
                <Route path="/threats" component={ThreatsPage} />
                <Route path="/security-methodology" component={SecurityMethodology} />
                <Route path="/submit-protocol" component={SubmitProtocol} />
                <Route path="/tutorials" component={Tutorials} />
                <Route path="/sponsorship" component={SponsorshipGuide} />
                <Route path="/report-scam" component={ReportScam} />
                <Route path="/community-reports" component={CommunityReports} />
                <Route path="/bounties" component={BountiesPage} />
                <Route path="/bug-bounties" component={BugBountiesDirectory} />
                <Route path="/audit-firms/register" component={AuditFirmRegister} />
                <Route path="/audit-firms/:id" component={AuditFirmDetail} />
                <Route path="/audit-firms" component={AuditFirmsPage} />
                <Route path="/chat/share/:id" component={SharedChatPage} />
                <Route path="/categories" component={CategoriesPage} />
                <Route path="/chat" component={ChatPage} />
                <Route path="/admin/login" component={AdminLogin} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
                {/* Legacy redirects */}
                <Route path="/security-stats">{() => { window.location.href = '/threats'; return null; }}</Route>
                <Route path="/how-it-works">{() => { window.location.href = '/security-methodology'; return null; }}</Route>
                <Route component={NotFound} />
              </Switch>
              </Suspense>
            </div>
            <Footer />
          </main>

          {/* Sidebar — right overlay */}
          <AppSidebar side="right" />
        </div>
      </div>

      {/* Floating "Chat with Dada" button */}
      <DadaFAB />
    </SidebarProvider>
  );
}

function App() {
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/protocols'] });
    queryClient.invalidateQueries({ queryKey: ['/api/volume/cross-chain'] });
    queryClient.invalidateQueries({ queryKey: ['/api/protocols/trending'] });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
