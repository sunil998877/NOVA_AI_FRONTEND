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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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

const navGroups = [
  {
    label: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/dashboard-view", label: "Dashboard View", icon: PanelsTopLeft },
    ],
  },
  {
    label: "Marketing",
    items: [
      { path: "/campaigns", label: "Your Campaigns", icon: Mail },
      { path: "/campaign-analytics", label: "Campaign Analytics", icon: ChartBar },
      { path: "/message-crafting", label: "Message Crafting", icon: MessageSquare },
    ],
  },
  {
    label: "Email",
    items: [
      { path: "/email-management", label: "Email Management", icon: Inbox },
      { path: "/email-tracking", label: "Email Tracking", icon: MousePointerClick },
      { path: "/newsletter-tracking", label: "Newsletter Tracking", icon: Newspaper },
    ],
  },
  {
    label: "Network",
    items: [
      { path: "/find-influencers", label: "Find Influencers", icon: Users },
      { path: "/my-influencers", label: "My Influencers", icon: Star },
      { path: "/collaboration-history", label: "Collaboration History", icon: History },
      { path: "/chat", label: "Chat", icon: MessageSquare },
    ],
  },
];

function AppSidebar(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const displayName = user?.fullName || "NOVA user";
  const displayEmail = user?.email || "signed in";
  const initials = getInitials(displayName, displayEmail);

  const [chatStats, setChatStats] = useState({
    unreadCount: 0,
    totalMessages: 0,
    influencersCount: 0,
    count: 0,
  });

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
    } catch (_) {}
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

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === "/chat" && location.pathname.startsWith("/chat")) ||
                    (item.path === "/dashboard" && location.pathname === "/") ||
                    (item.path === "/message-crafting" && location.pathname === "/message-crafter");

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <NavLink to={item.path}>
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      {item.path === "/chat" && (chatStats.unreadCount > 0 || chatStats.totalMessages > 0) && (
                        <SidebarMenuBadge
                          className={
                            chatStats.unreadCount > 0
                              ? "bg-emerald-500 text-white font-bold"
                              : "bg-muted text-muted-foreground font-semibold"
                          }
                          title={`${chatStats.totalMessages} messages from ${chatStats.influencersCount} creator${chatStats.influencersCount === 1 ? "" : "s"}${chatStats.unreadCount > 0 ? ` (${chatStats.unreadCount} unread)` : ""}`}
                        >
                          {chatStats.unreadCount > 0 ? chatStats.unreadCount : chatStats.totalMessages}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
