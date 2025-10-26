import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Shield, Video, Home, Clock, TrendingUp, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import Dashboard from "@/pages/Dashboard";
import NewDApps from "@/pages/NewDApps";
import TrendingDApps from "@/pages/TrendingDApps";
import Tutorials from "@/pages/Tutorials";
import NotFound from "@/pages/not-found";
import logoDark from "@assets/generated_images/JERUSALEM_Logo_Dark_Mode_bd91dd0a.png";
import logoLight from "@assets/generated_images/JERUSALEM_Logo_Light_Mode_5d31c9ec.png";

function Router() {
  const [location] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={theme === 'dark' ? logoDark : logoLight} 
                alt="JERUSALEM" 
                className="h-12 w-auto object-contain" 
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Link href="/">
                <Button 
                  variant={location === '/' ? 'default' : 'ghost'}
                  size="sm"
                  data-testid="nav-home"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/new">
                <Button 
                  variant={location === '/new' ? 'default' : 'ghost'}
                  size="sm"
                  data-testid="nav-new"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  New DApps
                </Button>
              </Link>
              <Link href="/trending">
                <Button 
                  variant={location === '/trending' ? 'default' : 'ghost'}
                  size="sm"
                  data-testid="nav-trending"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </Button>
              </Link>
              <Link href="/tutorials">
                <Button 
                  variant={location === '/tutorials' ? 'default' : 'ghost'}
                  size="sm"
                  data-testid="nav-tutorials"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Tutorials
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new" component={NewDApps} />
        <Route path="/trending" component={TrendingDApps} />
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
