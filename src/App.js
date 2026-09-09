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
const EmailManagement = lazy(() => import("./pages/EmailManagement"));
const EmailTracking = lazy(() => import("./pages/EmailTracking"));
const NewsletterTracking = lazy(() => import("./pages/NewsletterTracking"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { useAuth } from "./lib/AuthContext";
import { applyTheme, getTheme } from "./lib/theme";
import LoadingScreen from "./components/LoadingScreen";

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

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    applyTheme(getTheme());
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <LoadingScreen duration={3000} />;
  }

  return (
    <Suspense fallback={null}>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
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
      </Route>
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
