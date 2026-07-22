import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/Footer";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/Dashboard";
import NewDApps from "@/pages/NewDApps";
import TrendingDApps from "@/pages/TrendingDApps";
import Blacklist from "@/pages/Blacklist";
import BlacklistDetails from "@/pages/BlacklistDetails";
import ThreatsPage from "@/pages/ThreatsPage";
import ThreatEncyclopedia from "@/pages/ThreatEncyclopedia";
import ThreatDetail from "@/pages/ThreatDetail";
import SecurityMethodology from "@/pages/SecurityMethodology";
import SubmitProtocol from "@/pages/SubmitProtocol";
import ProtocolDetail from "@/pages/ProtocolDetail";
import Tutorials from "@/pages/Tutorials";
import SponsorshipGuide from "@/pages/SponsorshipGuide";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import ReportScam from "@/pages/ReportScam";
import CommunityReports from "@/pages/CommunityReports";
import BountiesPage from "@/pages/BountiesPage";
import BugBountiesDirectory from "@/pages/BugBountiesDirectory";
import AuditFirmsPage from "@/pages/AuditFirmsPage";
import AuditFirmDetail from "@/pages/AuditFirmDetail";
import AuditFirmRegister from "@/pages/AuditFirmRegister";
import ChatPage from "@/pages/ChatPage";
import SharedChatPage from "@/pages/SharedChatPage";
import CategoriesPage from "@/pages/CategoriesPage";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { Link } from "wouter";

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

/* ── DeFiJerusalem geometric logo icon ──────────────────────────── */
function LogoIcon() {
  return (
    <div className="relative w-9 h-9 flex items-center justify-center border border-[#E8C15A]/70 shrink-0">
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#E8C15A]" />
      <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#E8C15A]" />
      <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#E8C15A]" />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#E8C15A]" />
      {/* Centre crosshair */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-2.5 h-2.5 border border-[#E8C15A]/60" />
      </span>
      <span className="absolute top-1/2 left-0 right-0 h-px bg-[#E8C15A]/20" />
      <span className="absolute left-1/2 top-0 bottom-0 w-px bg-[#E8C15A]/20" />
    </div>
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
            <Link href="/" className="flex items-center gap-3 group">
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
              <Switch>
                <Route path="/" component={Dashboard} />
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
            </div>
            <Footer />
          </main>

          {/* Sidebar — right overlay */}
          <AppSidebar side="right" />
        </div>
      </div>
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
