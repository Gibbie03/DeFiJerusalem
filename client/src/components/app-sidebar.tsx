import { Link, useLocation } from "wouter";
import { Home, Clock, TrendingUp, Video, Shield, Landmark, Sun, Moon, Star, Lock, BookOpen, Upload, AlertTriangle, Library, Skull, AlertOctagon, Database, MessageSquare, Search, Users, Briefcase, ChevronDown } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback, memo } from "react";

const menuGroups = [
  {
    title: "Discover",
    icon: Search,
    items: [
      { title: "Home", url: "/", icon: Home },
      { title: "New DApps", url: "/new", icon: Clock },
      { title: "Trending", url: "/trending", icon: TrendingUp },
    ]
  },
  {
    title: "Security",
    icon: Shield,
    items: [
      { title: "Security Scanner", url: "/security-scanner", icon: Shield },
      { title: "Blacklisted", url: "/blacklist", icon: Lock },
      { title: "Security & Threats", url: "/threats", icon: AlertTriangle },
      { title: "Threat Encyclopedia", url: "/threats/encyclopedia", icon: Library },
      { title: "Scam Hall of Shame", url: "/scam-hall-of-shame", icon: Skull },
    ]
  },
  {
    title: "Education",
    icon: BookOpen,
    items: [
      { title: "Our Methodology", url: "/security-methodology", icon: BookOpen },
      { title: "Tutorials", url: "/tutorials", icon: Video },
    ]
  },
  {
    title: "Community",
    icon: Users,
    items: [
      { title: "Report Scam", url: "/report-scam", icon: AlertOctagon },
      { title: "Community Reports", url: "/community-reports", icon: MessageSquare },
      { title: "Scammer Addresses", url: "/scammer-addresses", icon: Database },
    ]
  },
  {
    title: "Partners",
    icon: Briefcase,
    items: [
      { title: "Submit Protocol", url: "/submit-protocol", icon: Upload },
      { title: "Sponsorship", url: "/sponsorship", icon: Star },
    ]
  },
] as const;

const adminItems = [
  { title: "Admin", url: "/admin/dashboard", icon: Landmark },
] as const;

interface AppSidebarProps {
  side?: "left" | "right";
}

function AppSidebarComponent({ side = "left" }: AppSidebarProps) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { setOpenMobile, isMobile } = useSidebar();
  
  // Track which groups are expanded (default all expanded)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Discover: true,
    Security: true,
    Education: true,
    Community: true,
    Partners: true,
  });

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
  
  const toggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
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
          <SidebarMenu>
            {menuGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups[group.title];
              const hasActiveItem = group.items.some(item => location === item.url);
              
              return (
                <SidebarMenuItem key={group.title}>
                  <SidebarMenuButton 
                    tooltip={group.title}
                    data-testid={`nav-group-${group.title.toLowerCase()}`}
                    onClick={() => toggleGroup(group.title)}
                    className={hasActiveItem ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                  >
                    <GroupIcon className="w-4 h-4" />
                    <span>{group.title}</span>
                    <ChevronDown className={`ml-auto w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </SidebarMenuButton>
                  {isExpanded && (
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = location === item.url;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                <ItemIcon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            })}
            
            {/* Admin section (not collapsible) */}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
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
