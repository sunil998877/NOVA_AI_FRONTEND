import React, { useMemo, useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Mail,
  Send,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "../components/ui/button";
import { useChartColors } from "../lib/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { CampaignFormDialog } from "../components/CampaignFormDialog";
import { campaignApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { buildMonthlyData, buildWeeklyPerformance } from "../lib/campaigns";

function AnimatedNumber({ value, duration = 1500 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return undefined;
    }
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function StatCard({ stat }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-5" />
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            stat.trend === "up" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
          }`}
        >
          <TrendIcon className="size-3" />
          {stat.change}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums md:text-3xl">
          <AnimatedNumber value={stat.value} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
      </CardContent>
    </Card>
  );
}

function Calendar() {
  const todayDate = new Date();
  const [cursor, setCursor] = useState(() => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today =
    todayDate.getMonth() === month && todayDate.getFullYear() === year ? todayDate.getDate() : null;
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const label = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{label}</CardTitle>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="py-1 text-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              disabled={!day}
              className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                day === today
                  ? "bg-primary text-primary-foreground"
                  : day
                    ? "text-foreground hover:bg-secondary"
                    : "invisible"
              }`}
            >
              {day || ""}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
        <p className="mb-1 text-sm font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function Dashboard() {
  const { user } = useAuth();
  const { campaigns, mails, stats, loading, error, reload } = useWorkspaceData();
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState("7D");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const chart = useChartColors();

  const unopened = Math.max((stats.delivered || 0) - (stats.opened || 0), 0);
  const statsCards = [
    { label: "Total Campaigns", value: stats.campaigns || 0, icon: Mail, trend: "up", change: loading ? "…" : "Live" },
    { label: "Total Mails", value: stats.total || 0, icon: Send, trend: "up", change: loading ? "…" : "Live" },
    { label: "Delivered", value: stats.delivered || 0, icon: ArrowUpRight, trend: "up", change: loading ? "…" : "Live" },
    { label: "Opened", value: stats.opened || 0, icon: Eye, trend: "up", change: loading ? "…" : "Live" },
    { label: "Unopened", value: unopened, icon: EyeOff, trend: "down", change: loading ? "…" : "Live" },
  ];

  const monthlyData = useMemo(() => buildMonthlyData(campaigns, mails), [campaigns, mails]);
  const performanceData = useMemo(() => buildWeeklyPerformance(mails), [mails]);
  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleCreate = async (payload) => {
    setSaving(true);
    setFormError("");
    try {
      await campaignApi.create(payload);
      setShowModal(false);
      await reload();
    } catch (err) {
      setFormError(err.message || "Could not create campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""} — your campaigns and tracking from NOVA.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full rounded-full sm:w-auto">
          <Plus />
          Add Email Campaign
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statsCards.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Performance Over Time</CardTitle>
              <CardDescription>{todayLabel}</CardDescription>
            </div>
            <div className="flex gap-1">
              {["7D", "30D", "90D"].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={period === item ? "default" : "secondary"}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chart.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.dim} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chart.dim} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="day" stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke={chart.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                  <Area type="monotone" dataKey="opened" name="Opened" stroke={chart.dim} strokeWidth={2} fillOpacity={1} fill="url(#colorOpened)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Calendar />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Emails Sent by Month</CardTitle>
            <CardDescription>Monthly email sending trends · {todayLabel}</CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex items-center gap-1.5 sm:justify-end">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-xl font-bold text-primary">{stats.total || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Emails</p>
            <p className="text-sm font-semibold">{stats.campaigns || 0} Campaigns</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chart.muted} fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="emails" name="Emails" fill={chart.primary} radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="campaigns" name="Campaigns" fill={chart.dim} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <CampaignFormDialog
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={handleCreate}
        submitting={saving}
        error={formError}
      />
    </div>
  );
}

export default Dashboard;
