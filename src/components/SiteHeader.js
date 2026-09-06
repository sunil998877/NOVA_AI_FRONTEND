import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { getInitials } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";
import { getTheme, toggleTheme } from "../lib/theme";

const pageMeta = {
  "/": { title: "Dashboard", section: "Overview" },
  "/dashboard": { title: "Dashboard", section: "Overview" },
  "/dashboard-view": { title: "Dashboard View", section: "Overview" },
  "/campaigns": { title: "Your Campaigns", section: "Marketing" },
  "/campaign-analytics": { title: "Campaign Analytics", section: "Marketing" },
  "/message-crafter": { title: "Message Crafter", section: "Marketing" },
  "/message-crafting": { title: "Message Crafting", section: "Marketing" },
  "/email-management": { title: "Email Management", section: "Email" },
  "/email-tracking": { title: "Email Tracking", section: "Email" },
  "/newsletter-tracking": { title: "Newsletter Tracking", section: "Email" },
  "/find-influencers": { title: "Find Influencers", section: "Network" },
  "/my-influencers": { title: "My Influencers", section: "Network" },
};

function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setThemeState] = useState(getTheme);
  const meta = pageMeta[location.pathname] || { title: "Dashboard", section: "Overview" };
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dark = theme === "dark";
  const displayName = user?.fullName || "NOVA user";
  const displayEmail = user?.email || "";
  const initials = getInitials(displayName, displayEmail);

  const onToggleTheme = () => {
    setThemeState(toggleTheme());
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:h-16 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-muted-foreground">{meta.section}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{meta.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="truncate text-sm font-semibold sm:hidden">{meta.title}</h1>
        <Badge variant="outline" className="hidden border-primary/30 text-primary lg:inline-flex">
          {today}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search campaigns, contacts..."
            className="h-9 w-44 bg-secondary/60 pl-8 lg:w-72"
          />
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search">
          <Search />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={onToggleTheme}
        >
          {dark ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left text-sm leading-tight lg:block">
                <span className="block font-medium">{displayName}</span>
                <span className="block text-[11px] text-muted-foreground">Admin</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
      </div>
    </header>
  );
}

export default SiteHeader;
