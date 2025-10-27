import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Landmark, Menu, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/Dashboard";
import NewDApps from "@/pages/NewDApps";
import TrendingDApps from "@/pages/TrendingDApps";
import Blacklist from "@/pages/Blacklist";
import Tutorials from "@/pages/Tutorials";
import NotFound from "@/pages/not-found";
import AddDAppByUrlDialog from "@/components/AddDAppByUrlDialog";

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
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full flex-col">
        {/* Top Header with Jerusalem Logo */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          {/* Jerusalem Branding - Top Level */}
          <div className="flex items-center justify-center py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center shadow-lg">
                <Landmark className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                JERUSALEM
              </h1>
            </div>
          </div>

          {/* Action Buttons - Second Level */}
          <div className="flex items-center justify-end gap-2 px-4 py-2">
            <AddDAppByUrlDialog />
            <CustomSidebarTrigger />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/new" component={NewDApps} />
              <Route path="/trending" component={TrendingDApps} />
              <Route path="/blacklist" component={Blacklist} />
              <Route path="/tutorials" component={Tutorials} />
              <Route component={NotFound} />
            </Switch>
          </main>

          {/* Sidebar on the Right */}
          <AppSidebar side="right" />
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
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
