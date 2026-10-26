import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Mail,
  ChartBar,
  MessageSquare,
  Inbox,
  MousePointerClick,
  Newspaper,
  Users,
  Star,
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
  History,
  Phone,
  PhoneCall,
  Flame,
  Layers,
  ShieldCheck,
  Upload,
  Database,
  ChevronUp,
  ChevronDown,
  CalendarClock,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { getInitials } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";
import { collabApi } from "../lib/api";
import { useSocket } from "../context/SocketContext";
import { cn } from "../lib/utils";

const navGroups = [
  {
    id: "overview",
    label: "OVERVIEW",
    icon: PanelsTopLeft,
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/dashboard-view", label: "Dashboard View", icon: PanelsTopLeft },
    ],
  },
  {
    id: "lead_management",
    label: "LEAD MANAGEMENT",
    icon: Database,
    items: [
      { path: "/leads", label: "Lead Management", icon: Users },
      { path: "/ase/leads/import", label: "Import Leads", icon: Upload },
    ],
  },
  {
    id: "sales_engine",
    label: "SALES ENGINE (ASE)",
    icon: Layers,
    items: [
      { path: "/ase/dashboard", label: "Sales Overview", icon: LayoutDashboard },
      { path: "/ase/leads", label: "Lead Store", icon: Users },
      { path: "/follow-ups", label: "Cold Follow-Ups", icon: CalendarClock },
      { path: "/ase/pipeline", label: "Pipeline Kanban", icon: PanelsTopLeft },
      { path: "/ase/calls", label: "Calling & Dialer", icon: PhoneCall },
      { path: "/ase/callbacks", label: "Callbacks Queue", icon: Flame },
      { path: "/ase/team-console", label: "Team Console", icon: Phone },
      { path: "/ase/segments", label: "Segments", icon: Layers },
      { path: "/ase/reports", label: "ASE Reports", icon: ChartBar },
      { path: "/ase/compliance", label: "Compliance & DNC", icon: ShieldCheck },
      { path: "/ase/playbook", label: "Sales Playbook", icon: BookOpen },
      { path: "/ase/settings", label: "ASE Settings", icon: Settings },
    ],
  },
  {
    id: "marketing",
    label: "MARKETING",
    icon: Mail,
    items: [
      { path: "/campaigns", label: "Your Campaigns", icon: Mail },
      { path: "/campaign-analytics", label: "Campaign Analytics", icon: ChartBar },
      { path: "/message-crafting", label: "Message Crafting", icon: MessageSquare },
    ],
  },
  {
    id: "email",
    label: "EMAIL",
    icon: Inbox,
    items: [
      { path: "/email-management", label: "Email Management", icon: Inbox },
      { path: "/email-tracking", label: "Email Tracking", icon: MousePointerClick },
      { path: "/newsletter-tracking", label: "Newsletter Tracking", icon: Newspaper },
    ],
  },
  {
    id: "network",
    label: "Influencer Marketing",
    icon: MessageSquare,
    items: [
      { path: "/find-influencers", label: "Find Influencers", icon: Users },
      { path: "/my-influencers", label: "My Influencers", icon: Star },
      { path: "/collaboration-history", label: "Collaboration History", icon: History },
      { path: "/chat", label: "Live Chat", icon: MessageSquare },
    ],
  },
];

function AppSidebar(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const displayName = user?.fullName || "NOVA user";
  const displayEmail = user?.email || "signed in";
  const initials = getInitials(displayName, displayEmail);

  const [chatStats, setChatStats] = useState({
    unreadCount: 0,
    totalMessages: 0,
    influencersCount: 0,
    count: 0,
  });

  const isItemActive = useCallback(
    (path) => {
      return (
        location.pathname === path ||
        (path === "/chat" && location.pathname.startsWith("/chat")) ||
        (path === "/dashboard" && location.pathname === "/") ||
        (path === "/message-crafting" && location.pathname === "/message-crafter") ||
        (path === "/ase/leads" && location.pathname.startsWith("/ase/leads/"))
      );
    },
    [location.pathname]
  );

  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_open_groups");
      if (saved) return JSON.parse(saved);
    } catch (_) { }
    return {
      overview: true,
      lead_management: true,
      sales_engine: true,
      marketing: true,
      email: true,
      network: true,
    };
  });

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem("sidebar_open_groups", JSON.stringify(next));
      } catch (_) { }
      return next;
    });
  };

  useEffect(() => {
    const activeGroup = navGroups.find((g) =>
      g.items.some((item) => isItemActive(item.path))
    );
    if (activeGroup && !openGroups[activeGroup.id]) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [location.pathname, isItemActive]);

  const fetchChatCount = useCallback(async () => {
    try {
      const res = await collabApi.getChatCount();
      if (res) {
        setChatStats({
          unreadCount: Number(res.unreadCount || 0),
          totalMessages: Number(res.totalMessages || 0),
          influencersCount: Number(res.influencersCount || 0),
          count: Number(res.count ?? (res.unreadCount > 0 ? res.unreadCount : res.totalMessages) ?? 0),
        });
      }
    } catch (_) { }
  }, []);

  useEffect(() => {
    fetchChatCount();
    const interval = setInterval(fetchChatCount, 15000);
    const onChatEvent = () => fetchChatCount();
    window.addEventListener("nova-chat-updated", onChatEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener("nova-chat-updated", onChatEvent);
    };
  }, [fetchChatCount, location.pathname]);

  useEffect(() => {
    if (!socket) return;
    const onNewMsg = () => fetchChatCount();
    const onUpdated = () => fetchChatCount();
    socket.on("newMessage", onNewMsg);
    socket.on("conversation:updated", onUpdated);
    return () => {
      socket.off("newMessage", onNewMsg);
      socket.off("conversation:updated", onUpdated);
    };
  }, [socket, fetchChatCount]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="NOVA Email Marketer" className="hover:bg-sidebar-accent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-wide">NOVA</span>
                <span className="truncate text-xs text-muted-foreground">Email Marketer</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-2">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          const hasActiveItem = group.items.some((item) => isItemActive(item.path));

          if (isCollapsed) {
            return (
              <SidebarGroup key={group.id} className="p-1">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={`${group.label} (${group.items.length})`}
                      isActive={hasActiveItem}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <group.icon className="size-4 text-neutral-700 dark:text-neutral-300" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          return (
            <div key={group.id} className="flex flex-col mb-1.5 select-none">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40 transition-colors rounded-md group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <group.icon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                  <span className="truncate">{group.label}</span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 shrink-0 ml-1 transition-transform duration-200">
                  {isOpen ? (
                    <ChevronUp className="size-3.5 stroke-[2.25]" />
                  ) : (
                    <ChevronDown className="size-3.5 stroke-[2.25]" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-0.5 mt-0.5 animate-in fade-in-50 duration-150">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center justify-between mx-2 px-3 py-2 text-[13.5px] transition-all rounded-xl",
                          isActive
                            ? "bg-[#faeee9] dark:bg-orange-950/40 text-[#9a3412] dark:text-[#ff9270] font-semibold shadow-none"
                            : "text-sidebar-foreground/80 hover:text-foreground hover:bg-muted/40 font-normal"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.icon && (
                            <item.icon
                              className={cn(
                                "size-4 shrink-0 transition-colors",
                                isActive
                                  ? "text-[#9a3412] dark:text-[#ff9270]"
                                  : "text-sidebar-foreground/75"
                              )}
                            />
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.path === "/chat" && (chatStats.unreadCount > 0 || chatStats.totalMessages > 0) && (
                          <span
                            className={cn(
                              "ml-auto text-[11px] px-1.5 py-0.2 rounded-full font-bold",
                              chatStats.unreadCount > 0
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {chatStats.unreadCount > 0 ? chatStats.unreadCount : chatStats.totalMessages}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
