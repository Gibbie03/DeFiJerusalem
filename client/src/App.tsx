import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/Footer";
import { Landmark, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/Dashboard";
import NewDApps from "@/pages/NewDApps";
import TrendingDApps from "@/pages/TrendingDApps";
import Blacklist from "@/pages/Blacklist";
import Tutorials from "@/pages/Tutorials";
import SponsorshipGuide from "@/pages/SponsorshipGuide";
import HowItWorks from "@/pages/HowItWorks";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover-elevate"
      onClick={toggleSidebar}
      data-testid="button-sidebar-toggle"
    >
      <Menu className="w-4 h-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function Router() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex flex-col h-screen w-full">
        {/* Top Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm z-50 shrink-0">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Jerusalem Logo - Left */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center shadow-lg">
                <Landmark className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                JERUSALEM
              </h1>
            </div>

            {/* Sidebar Toggle - Right */}
            <CustomSidebarTrigger />
          </div>
        </header>

        {/* Main Container below header */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/new" component={NewDApps} />
                <Route path="/trending" component={TrendingDApps} />
                <Route path="/blacklist" component={Blacklist} />
                <Route path="/how-it-works" component={HowItWorks} />
                <Route path="/tutorials" component={Tutorials} />
                <Route path="/sponsorship" component={SponsorshipGuide} />
                <Route path="/admin/login" component={AdminLogin} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
                <Route component={NotFound} />
              </Switch>
            </div>
            <Footer />
          </main>

          {/* Sidebar on the Right - overlays on top */}
          <AppSidebar side="right" />
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  // Force invalidate all cached queries on app mount to ensure fresh data
  // Fixes mobile browser cache persistence issues across different browsers
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
