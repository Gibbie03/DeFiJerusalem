import { Link, useLocation } from "wouter";
import { Home, Clock, TrendingUp, Video, Shield, Landmark, Sun, Moon, Star, Lock, BookOpen, Upload, AlertTriangle, Library, Skull, AlertOctagon, Database, MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback, memo } from "react";

const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "New DApps",
    url: "/new",
    icon: Clock,
  },
  {
    title: "Trending",
    url: "/trending",
    icon: TrendingUp,
  },
  {
    title: "Security Scanner",
    url: "/security-scanner",
    icon: Shield,
  },
  {
    title: "Report Scam",
    url: "/report-scam",
    icon: AlertOctagon,
  },
  {
    title: "Community Reports",
    url: "/community-reports",
    icon: MessageSquare,
  },
  {
    title: "Scammer Addresses",
    url: "/scammer-addresses",
    icon: Database,
  },
  {
    title: "Submit Protocol",
    url: "/submit-protocol",
    icon: Upload,
  },
  {
    title: "Blacklisted",
    url: "/blacklist",
    icon: Lock,
  },
  {
    title: "Security & Threats",
    url: "/threats",
    icon: AlertTriangle,
  },
  {
    title: "Threat Encyclopedia",
    url: "/threats/encyclopedia",
    icon: Library,
  },
  {
    title: "Scam Hall of Shame",
    url: "/scam-hall-of-shame",
    icon: Skull,
  },
  {
    title: "Our Methodology",
    url: "/security-methodology",
    icon: BookOpen,
  },
  {
    title: "Tutorials",
    url: "/tutorials",
    icon: Video,
  },
  {
    title: "Sponsorship",
    url: "/sponsorship",
    icon: Star,
  },
  {
    title: "Admin",
    url: "/admin/dashboard",
    icon: Landmark,
  },
] as const;

interface AppSidebarProps {
  side?: "left" | "right";
}

function AppSidebarComponent({ side = "left" }: AppSidebarProps) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    }
  }, []);

  // Auto-close sidebar when route changes (mobile only)
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location, isMobile, setOpenMobile]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  const themeIcon = useMemo(() => 
    theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />,
    [theme]
  );

  const themeLabel = useMemo(() => 
    theme === 'dark' ? 'Light Mode' : 'Dark Mode',
    [theme]
  );

  return (
    <Sidebar side={side} collapsible="offcanvas" className="border-l">
      <SidebarContent className="pt-8">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start"
          data-testid="button-theme-toggle"
        >
          {themeIcon}
          {themeLabel}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
