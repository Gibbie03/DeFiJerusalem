import { Link, useLocation } from "wouter";
import {
  Home, Clock, TrendingUp, Video, Shield, Landmark, Sun, Moon,
  Star, Lock, BookOpen, Upload, AlertTriangle, Library,
  AlertOctagon, MessageSquare, Search, Users, Briefcase,
  ChevronDown, Trophy, Award, Bot, BarChart3, Bug,
} from "lucide-react";
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
      { title: "Home",          url: "/home",        icon: Home },
      { title: "Categories",    url: "/categories", icon: BarChart3 },
      { title: "New Protocols", url: "/new",        icon: Clock },
      { title: "Trending",      url: "/trending",   icon: TrendingUp },
      { title: "Ask AI",        url: "/chat",       icon: Bot },
    ],
  },
  {
    title: "Security",
    icon: Shield,
    items: [
      { title: "Flagged Protocols",  url: "/blacklist",             icon: Lock },
      { title: "Threat Intelligence",url: "/threats",               icon: AlertTriangle },
      { title: "Threat Encyclopedia",url: "/threats/encyclopedia",  icon: Library },
      { title: "Protocol Bug Bounties", url: "/bug-bounties",       icon: Bug },
    ],
  },
  {
    title: "Education",
    icon: BookOpen,
    items: [
      { title: "Our Methodology", url: "/security-methodology", icon: BookOpen },
      { title: "Tutorials",       url: "/tutorials",            icon: Video },
    ],
  },
  {
    title: "Community",
    icon: Users,
    items: [
      { title: "Contribute & Earn",  url: "/bounties",          icon: Trophy },
      { title: "Report Protocol",    url: "/report-scam",       icon: AlertOctagon },
      { title: "Community Reports",  url: "/community-reports", icon: MessageSquare },
    ],
  },
  {
    title: "Audit Firms",
    icon: Award,
    items: [
      { title: "Firm Directory", url: "/audit-firms",          icon: Shield },
      { title: "Register Firm",  url: "/audit-firms/register", icon: Upload },
    ],
  },
  {
    title: "Partners",
    icon: Briefcase,
    items: [
      { title: "Submit Protocol", url: "/submit-protocol", icon: Upload },
      { title: "Sponsorship",     url: "/sponsorship",     icon: Star },
    ],
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Discover:    true,
    Security:    true,
    Education:   true,
    Community:   true,
    Partners:    true,
  });

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const active = stored ?? 'dark';
    setTheme(active);
    document.documentElement.classList.toggle('dark', active === 'dark');
  }, []);

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location, isMobile, setOpenMobile]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  const toggleGroup = useCallback((title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const themeIcon  = useMemo(() => theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />, [theme]);
  const themeLabel = useMemo(() => theme === 'dark' ? 'Light Mode' : 'Dark Mode', [theme]);

  return (
    <Sidebar
      side={side}
      collapsible="offcanvas"
      className="border-l border-[#1a1a1a] bg-[#060606]"
    >
      <SidebarContent className="pt-6 bg-[#060606]">
        <SidebarGroup className="px-0">
          <SidebarMenu>
            {menuGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups[group.title];
              const hasActive = group.items.some(item => location === item.url);

              return (
                <SidebarMenuItem key={group.title}>
                  {/* Group header */}
                  <SidebarMenuButton
                    tooltip={group.title}
                    data-testid={`nav-group-${group.title.toLowerCase()}`}
                    onClick={() => toggleGroup(group.title)}
                    className={[
                      "flex items-center gap-2.5 px-4 py-2.5 w-full text-left transition-colors",
                      "text-xs font-bold tracking-[0.18em] uppercase",
                      hasActive
                        ? "text-[#E8C15A]"
                        : "text-white/35 hover:text-white/65",
                    ].join(" ")}
                  >
                    <GroupIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">{group.title}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </SidebarMenuButton>

                  {/* Sub-items */}
                  {isExpanded && (
                    <SidebarMenuSub className="border-l border-[#1a1a1a] ml-5 pl-0">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = location === item.url;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link
                                href={item.url}
                                data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                                className={[
                                  "flex items-center gap-2.5 px-4 py-2 text-[11px] font-medium tracking-wide transition-colors",
                                  isActive
                                    ? "text-[#E8C15A] border-l-2 border-[#E8C15A] -ml-px pl-[calc(1rem-1px)]"
                                    : "text-white/45 hover:text-white/75",
                                ].join(" ")}
                              >
                                <ItemIcon className="w-3.5 h-3.5 shrink-0" />
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

            {/* Admin (non-collapsible) */}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={item.url}
                      data-testid="nav-admin"
                      className={[
                        "flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold tracking-[0.18em] uppercase transition-colors",
                        isActive ? "text-[#E8C15A]" : "text-white/30 hover:text-white/60",
                      ].join(" ")}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#1a1a1a] p-4 bg-[#060606] space-y-3">
        {/* Chat with Dada CTA */}
        <Link href="/chat" onClick={() => { if (isMobile) setOpenMobile(false); }}>
          <div className="flex items-center gap-2.5 w-full border border-[#E8C15A]/50 hover:border-[#E8C15A] hover:bg-[#E8C15A]/8 px-3 py-2.5 transition-colors group">
            <Bot className="w-3.5 h-3.5 text-[#E8C15A]/70 group-hover:text-[#E8C15A] shrink-0 transition-colors" />
            <span className="text-[10px] font-black tracking-[0.18em] uppercase text-[#E8C15A]/70 group-hover:text-[#E8C15A] transition-colors">
              Chat with Dada
            </span>
          </div>
        </Link>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 text-[10px] font-bold tracking-[0.18em] uppercase text-white/30 hover:text-white/60 transition-colors w-full"
          data-testid="button-theme-toggle"
        >
          {themeIcon}
          {themeLabel}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
