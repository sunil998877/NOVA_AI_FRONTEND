import React, { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import SiteHeader from "./components/SiteHeader";
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardView = lazy(() => import("./pages/DashboardView"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignAnalytics = lazy(() => import("./pages/CampaignAnalytics"));
const MessageCrafter = lazy(() => import("./pages/MessageCrafter"));
const MessageCrafting = lazy(() => import("./pages/MessageCrafting"));
const FindInfluencers = lazy(() => import("./pages/FindInfluencers"));
const MyInfluencers = lazy(() => import("./pages/MyInfluencers"));
const CollaborationHistory = lazy(() => import("./pages/CollaborationHistory"));
const Chat = lazy(() => import("./pages/Chat"));
const EmailManagement = lazy(() => import("./pages/EmailManagement"));
const EmailTracking = lazy(() => import("./pages/EmailTracking"));
const NewsletterTracking = lazy(() => import("./pages/NewsletterTracking"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const CreatorCollabPortal = lazy(() => import("./pages/CreatorCollabPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { useAuth } from "./lib/AuthContext";
import { applyTheme, getTheme } from "./lib/theme";
import LoadingScreen from "./components/LoadingScreen";
import TopProgressBar from "./components/TopProgressBar";
import { collabApi } from "./lib/api";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 flex-1 overflow-x-hidden">
        <SiteHeader />
        <div className="flex min-h-0 flex-1 min-w-0 flex-col gap-4 p-4 pt-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function RequireAuth() {
  const { authed } = useAuth();
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}

function RequireAuthBare() {
  const { authed } = useAuth();
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function App() {
  const isCollab = typeof window !== "undefined" && window.location.pathname.startsWith("/collab/");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    applyTheme(getTheme());

    if (isCollab) {
      const parts = window.location.pathname.split("/collab/");
      const token = parts[1]?.split("/")[0]?.split("?")[0];
      if (token) {
        collabApi.prefetchPortal(token);
      }
    }

    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isCollab]);

  if (initialLoading) {
    return (
      <LoadingScreen
        duration={3000}
        subtitle={isCollab ? "Opening collaboration portal..." : "Preparing your Nova workspace..."}
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <TopProgressBar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/collab/:token" element={<CreatorCollabPortal />} />
        <Route element={<RequireAuthBare />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-view" element={<DashboardView />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaign-analytics" element={<CampaignAnalytics />} />
          <Route path="/message-crafter" element={<MessageCrafter />} />
          <Route path="/message-crafting" element={<MessageCrafting />} />
          <Route path="/email-management" element={<EmailManagement />} />
          <Route path="/email-tracking" element={<EmailTracking />} />
          <Route path="/newsletter-tracking" element={<NewsletterTracking />} />
          <Route path="/find-influencers" element={<FindInfluencers />} />
          <Route path="/my-influencers" element={<MyInfluencers />} />
          <Route path="/collaboration-history" element={<CollaborationHistory />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
