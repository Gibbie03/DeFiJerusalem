import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Shield, Video } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Tutorials from "@/pages/Tutorials";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-orange-500 to-primary rounded-md flex items-center justify-center">
                <Shield className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent">
                  Jerusalem
                </h1>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Shield className="w-3 h-3" />
                  AI Security Scanner
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button 
                  variant={location === '/' ? 'default' : 'ghost'}
                  data-testid="nav-dashboard"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Scanner
                </Button>
              </Link>
              <Link href="/tutorials">
                <Button 
                  variant={location === '/tutorials' ? 'default' : 'ghost'}
                  data-testid="nav-tutorials"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Tutorials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tutorials" component={Tutorials} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
