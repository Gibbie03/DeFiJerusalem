import { Link, useLocation } from "wouter";
import { Home, Clock, TrendingUp, Video, Shield, Landmark, Sun, Moon, Star, Lock, BookOpen, BarChart3, ScanSearch, Upload, AlertTriangle, Library, Skull, Wallet } from "lucide-react";
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
import { useState, useEffect } from "react";

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
    title: "Scan Website",
    url: "/scan-website",
    icon: ScanSearch,
  },
  {
    title: "Scan Wallet",
    url: "/scan-wallet",
    icon: Wallet,
  },
  {
    title: "Submit Protocol",
    url: "/submit-protocol",
    icon: Upload,
  },
  {
    title: "Blacklisted",
    url: "/blacklist",
    icon: Shield,
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
    icon: Lock,
  },
];

interface AppSidebarProps {
  side?: "left" | "right";
}

export function AppSidebar({ side = "left" }: AppSidebarProps) {
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
  }, [location, isMobile]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Sidebar side={side} collapsible="offcanvas" className="border-l">
      <SidebarContent className="pt-8">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
          {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
