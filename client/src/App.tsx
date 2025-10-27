import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/Dashboard";
import NewDApps from "@/pages/NewDApps";
import TrendingDApps from "@/pages/TrendingDApps";
import Blacklist from "@/pages/Blacklist";
import Tutorials from "@/pages/Tutorials";
import NotFound from "@/pages/not-found";

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
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-center p-3 border-b">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-lg font-bold">JERUSALEM</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2">
              <CustomSidebarTrigger />
            </div>
          </header>
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
