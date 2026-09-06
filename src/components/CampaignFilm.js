import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Bot,
  Users,
  Layout,
  Send,
  BarChart3,
  UserCheck,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const TOTAL_DURATION_SEC = 60;
const SCENE_DURATION_SEC = 10;

const scenes = [
  {
    id: "ai-crafter",
    kicker: "01 / 06 · AI COPY & MESSAGE CRAFTER",
    title: "AI Writes High-Converting Emails in Seconds",
    subtitle:
      "Neural engine generates magnetic subject lines, personalization hooks, and high-CTR calls to action.",
    badge: "🧠 Generative AI Engine",
    color: "from-purple-500 to-cyan-400",
    glowColor: "rgba(168, 85, 247, 0.35)",
    tint: "from-[#0e0a1a] via-[#1a1033] to-[#07050d]",
    Scene: AiCrafterScene,
  },
  {
    id: "smart-segmentation",
    kicker: "02 / 06 · PREDICTIVE AUDIENCE AI",
    title: "Smart Segmentation & 99.8% Deliverability",
    subtitle:
      "Automatically clusters VIPs, active clickers, and new leads with dynamic variable tag injection.",
    badge: "🎯 Precision Targeting",
    color: "from-emerald-400 to-teal-300",
    glowColor: "rgba(16, 185, 129, 0.35)",
    tint: "from-[#051711] via-[#0a261c] to-[#040e0b]",
    Scene: SmartSegmentationScene,
  },
  {
    id: "visual-studio",
    kicker: "03 / 06 · INTERACTIVE EMAIL STUDIO",
    title: "Visual Drag & Drop Canvas with Dynamic Blocks",
    subtitle:
      "Design mobile-responsive dark and light templates with live countdown timers and product cards.",
    badge: "🎨 Visual Template AI",
    color: "from-pink-500 to-amber-400",
    glowColor: "rgba(236, 72, 153, 0.35)",
    tint: "from-[#1c0a17] via-[#2d1124] to-[#0c040a]",
    Scene: VisualStudioScene,
  },
  {
    id: "smart-send",
    kicker: "04 / 06 · SMART SEND & SPAM SHIELD",
    title: "AI Send-Time Optimization & Spam Defense",
    subtitle:
      "Predicts individual open windows and routes through multi-SMTP clusters with zero spam flag risk.",
    badge: "⚡ 3,400 Sends / Sec",
    color: "from-blue-500 to-cyan-400",
    glowColor: "rgba(59, 130, 246, 0.35)",
    tint: "from-[#071426] via-[#0d2242] to-[#030a14]",
    Scene: SmartSendScene,
  },
  {
    id: "live-tracking",
    kicker: "05 / 06 · REAL-TIME ANALYTICS STREAM",
    title: "Live Open Rates, Heatmaps & Revenue Attribution",
    subtitle:
      "Stream recipient opens, clicks, and checkout conversions in real-time with zero delay.",
    badge: "📊 Live Click Stream",
    color: "from-rose-500 to-orange-400",
    glowColor: "rgba(244, 63, 94, 0.35)",
    tint: "from-[#1d0711] via-[#2f0c1c] to-[#0b0207]",
    Scene: LiveTrackingScene,
  },
  {
    id: "influencer-outreach",
    kicker: "06 / 06 · AI CREATOR OUTREACH & ROI",
    title: "Find Top Influencers & Launch End-to-End Campaigns",
    subtitle:
      "Match with vetted creators, dispatch personalized pitches, and track complete multi-channel ROI.",
    badge: "🌟 18.4x Average ROI",
    color: "from-violet-500 to-emerald-400",
    glowColor: "rgba(139, 92, 246, 0.35)",
    tint: "from-[#150a24] via-[#22103a] to-[#080310]",
    Scene: InfluencerOutreachScene,
  },
];

function playTone(freq = 440, type = "sine", duration = 0.25) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {

  }
}

function WindowChrome({ title, badge, icon: Icon }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_8px_rgba(255,95,87,0.6)]" />
        <span className="size-2.5 rounded-full bg-[#febc2e] shadow-[0_0_8px_rgba(254,188,46,0.6)]" />
        <span className="size-2.5 rounded-full bg-[#28c840] shadow-[0_0_8px_rgba(40,200,64,0.6)]" />
        <p className="ml-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/80">
          {Icon && <Icon className="size-3.5 text-cyan-400" />}
          {title}
        </p>
      </div>
      {badge && (
        <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-cyan-300">
          <span className="size-1.5 animate-ping rounded-full bg-cyan-400" />
          {badge}
        </span>
      )}
    </div>
  );
}

function AiCrafterScene() {
  const [typedSubject, setTypedSubject] = useState("");
  const fullSubject = "🔥 Flash VIP Access: Your 40% Curated Summer Picks Are Live";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullSubject.length) {
        setTypedSubject(fullSubject.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-purple-500/30 bg-black/60 shadow-[0_20px_70px_rgba(147,51,234,0.25)] backdrop-blur-xl">
        <WindowChrome title="NOVA AI · Neural Message Crafter" badge="GPT-4 Turbo Email Tuning" icon={Bot} />

        <div className="grid gap-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Prompt Objective</span>
              <p className="mt-1 text-xs font-medium text-white">"VIP Flash Sale · High Urgency + Personal Voice"</p>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">AI Optimization Score</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-bold text-white">98.6 / 100</span>
                <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-purple-200">+34% Open Rate</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/50">
              <span>Subject Line (AI Generated)</span>
              <span className="text-cyan-400">Predicted CTR: 28.4%</span>
            </div>
            <p className="mt-1.5 min-h-[1.75rem] font-mono text-sm font-bold text-cyan-300 sm:text-base">
              {typedSubject}
              <span className="inline-block h-4 w-1 animate-pulse bg-cyan-400 align-middle ml-1" />
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/80">
            <p className="font-semibold text-white">
              Hey <span className="rounded bg-purple-500/30 px-1 text-purple-200">{"{{first_name}}"}</span>, your exclusive 40% access is unlocked for the next 24 hours.
            </p>
            <p className="mt-1 text-white/60">
              We selected items based on your interest in <span className="rounded bg-cyan-500/20 px-1 text-cyan-300">{"{{favorite_category}}"}</span>.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                <Sparkles className="size-3.5" />
                Claim VIP Discount →
              </span>
              <span className="text-[11px] text-white/40">✓ Anti-Spam Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartSegmentationScene() {
  const segments = [
    { name: "🔥 High-Value VIP Buyers", count: "4,820 recipients", rate: "94% Open Rate", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
    { name: "⚡ Engaged Weekend Clickers", count: "12,450 recipients", rate: "88% Open Rate", color: "border-teal-500/40 bg-teal-500/10 text-teal-300" },
    { name: "✨ Re-Engagement Cohort", count: "3,120 recipients", rate: "AI Drip Active", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 shadow-[0_20px_70px_rgba(16,185,129,0.25)] backdrop-blur-xl">
        <WindowChrome title="NOVA AI · Audience Clustering & Tags" badge="Clean List Score: 99.8%" icon={Users} />

        <div className="grid gap-3.5 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-xs font-semibold text-white/60">Total Active Verified Audience</p>
              <p className="text-2xl font-black text-white sm:text-3xl">20,390 <span className="text-sm font-normal text-emerald-400">Subscribers</span></p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <ShieldCheck className="size-4" />
              <span>Zero Bounce Guarantee</span>
            </div>
          </div>

          <div className="grid gap-2.5">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className={`flex items-center justify-between rounded-xl border p-3 ${seg.color}`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white sm:text-sm">{seg.name}</p>
                    <p className="text-[11px] text-white/60">{seg.count}</p>
                  </div>
                </div>
                <span className="rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white">
                  {seg.rate}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-white/50">Dynamic AI Tags:</span>
            {["{{first_name}}", "{{last_purchase}}", "{{discount_code}}", "{{geo_city}}"].map((tag) => (
              <span key={tag} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualStudioScene() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-pink-500/30 bg-black/60 shadow-[0_20px_70px_rgba(236,72,153,0.25)] backdrop-blur-xl">
        <WindowChrome title="NOVA Visual Studio · Responsive Builder" badge="Dark & Light Mode Ready" icon={Layout} />

        <div className="grid gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs">
            <span className="font-semibold text-white">Live Campaign Canvas Preview</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-300">📱 Mobile (100%)</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">💻 Desktop</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-pink-500/30 bg-gradient-to-b from-[#251020] to-[#150a14] p-4 text-center">
            <span className="inline-block rounded-full bg-pink-500/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-pink-200">
              Limited Edition Release
            </span>
            <h4 className="mt-2 text-lg font-extrabold text-white sm:text-xl">SUMMER DROPS & VIP PERKS</h4>
            <p className="mx-auto mt-1 max-w-sm text-xs text-white/70">
              Handcrafted for your style. Save 40% before timer expires.
            </p>

            <div className="my-3 flex justify-center gap-2 text-center">
              {[
                { val: "08", lbl: "HOURS" },
                { val: "42", lbl: "MINUTES" },
                { val: "19", lbl: "SECONDS" },
              ].map((t) => (
                <div key={t.lbl} className="rounded-lg border border-pink-400/30 bg-black/50 px-3 py-1.5">
                  <span className="font-mono text-sm font-black text-amber-300 sm:text-base">{t.val}</span>
                  <p className="text-[8px] font-semibold text-white/40">{t.lbl}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 px-5 py-2 text-xs font-extrabold text-white shadow-[0_0_20px_rgba(236,72,153,0.6)]"
            >
              <Flame className="size-3.5 text-amber-200" />
              Shop The Exclusive Drop →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartSendScene() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-500/30 bg-black/60 shadow-[0_20px_70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
        <WindowChrome title="NOVA · Smart Send & Deliverability Shield" badge="AI Optimal Time Match" icon={Send} />

        <div className="grid gap-4 p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
              <Zap className="mx-auto size-4 text-cyan-300" />
              <p className="mt-1 text-lg font-black text-white sm:text-2xl">3,400</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Emails / Sec</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <ShieldCheck className="mx-auto size-4 text-emerald-300" />
              <p className="mt-1 text-lg font-black text-white sm:text-2xl">0.01</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Spam Score (Safe)</p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
              <TrendingUp className="mx-auto size-4 text-cyan-300" />
              <p className="mt-1 text-lg font-black text-white sm:text-2xl">99.9%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Primary Inbox</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">AI Send Queue: Multi-Cluster SMTP Routing</span>
              <span className="font-mono text-cyan-400">18,400 / 20,390 Sent</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: "20%" }}
                animate={{ width: "92%" }}
                transition={{ duration: 3.5, ease: "easeInOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
              <span>⚡ Recipient Time Zone Matching: Active</span>
              <span>🔒 SPF, DKIM & DMARC Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveTrackingScene() {
  const bars = [45, 62, 78, 89, 96, 84, 98];
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60 shadow-[0_20px_70px_rgba(244,63,94,0.25)] backdrop-blur-xl">
        <WindowChrome title="NOVA Analytics · Real-Time Conversion Stream" badge="Live Webhooks Active" icon={BarChart3} />

        <div className="grid gap-4 p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Open Rate</p>
              <p className="mt-1 text-xl font-black text-white sm:text-2xl">68.4%</p>
              <span className="text-[10px] text-emerald-400">↑ 22% vs Ind. Avg</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Click Rate</p>
              <p className="mt-1 text-xl font-black text-white sm:text-2xl">24.8%</p>
              <span className="text-[10px] text-emerald-400">↑ 3.8x Benchmark</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Attributed Sales</p>
              <p className="mt-1 text-xl font-black text-white sm:text-2xl">$18,450</p>
              <span className="text-[10px] text-emerald-400">42 Orders / hr</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="text-[11px] font-semibold text-white/70">Live Activity Feed</p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-emerald-300">
                  <span>🟢 Priya S. opened email</span>
                  <span className="text-[10px] text-white/40">1s ago</span>
                </div>
                <div className="flex items-center justify-between text-cyan-300">
                  <span>🔵 Liam K. clicked "Claim VIP"</span>
                  <span className="text-[10px] text-white/40">3s ago</span>
                </div>
                <div className="flex items-center justify-between text-purple-300">
                  <span>🟣 Chloe M. placed $140 order</span>
                  <span className="text-[10px] text-white/40">7s ago</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="mb-2 text-[11px] font-semibold text-white/70">Hourly Velocity</p>
              <div className="flex h-16 items-end gap-1.5">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="flex-1 rounded-t bg-gradient-to-t from-rose-600 to-amber-400"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfluencerOutreachScene() {
  const creators = [
    { name: "@sophia_style", niche: "Fashion & Lifestyle", match: "99% Match", status: "Pitch Accepted" },
    { name: "@tech_alex", niche: "Software & Productivity", match: "96% Match", status: "Collab Active" },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-violet-500/30 bg-black/60 shadow-[0_20px_70px_rgba(139,92,246,0.25)] backdrop-blur-xl">
        <WindowChrome title="NOVA AI · Creator Discovery & Outreach" badge="Automated Pitch Engine" icon={UserCheck} />

        <div className="grid gap-3.5 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-xs font-semibold text-white/60">Campaign ROI Generated</p>
              <p className="text-2xl font-black text-white sm:text-3xl">18.4x <span className="text-sm font-normal text-violet-300">Revenue Multiple</span></p>
            </div>
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-300">
              ⚡ 1-Minute Full Stack
            </div>
          </div>

          <div className="grid gap-2">
            {creators.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                <div>
                  <p className="font-bold text-white">{c.name}</p>
                  <p className="text-[11px] text-white/50">{c.niche}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-violet-500/20 px-2 py-0.5 font-bold text-violet-300">{c.match}</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">{c.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/70">Ready to launch your own automated campaign?</p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-4 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.5)] transition hover:opacity-90"
            >
              Start Free Today <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignFilm({ compact = false }) {
  const [currentSec, setCurrentSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const sceneIndex = Math.min(
    Math.floor(currentSec / SCENE_DURATION_SEC),
    scenes.length - 1
  );
  const currentScene = scenes[sceneIndex];
  const SceneComponent = currentScene.Scene;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentSec((prev) => {
        const next = (prev + 0.5) % TOTAL_DURATION_SEC;

        if (Math.floor(next / SCENE_DURATION_SEC) !== Math.floor(prev / SCENE_DURATION_SEC) && !muted) {
          playTone(520, "triangle", 0.3);
        }
        return next;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying, muted]);

  const handleSeek = (sec) => {
    setCurrentSec(sec);
    if (!muted) playTone(440, "sine", 0.15);
  };

  const togglePlay = () => {
    setIsPlaying((val) => !val);
  };

  const handleRestart = () => {
    setCurrentSec(0);
    setIsPlaying(true);
    if (!muted) playTone(587.33, "triangle", 0.2);
  };

  const toggleMute = () => {
    setMuted((val) => {
      const next = !val;
      if (!next) playTone(659.25, "sine", 0.2);
      return next;
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const formattedTime = `${Math.floor(currentSec / 60)}:${Math.floor(currentSec % 60)
    .toString()
    .padStart(2, "0")}`;
  const totalFormattedTime = `1:00`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#04060a] select-none ${isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full min-h-[560px] sm:min-h-[640px]"
        }`}
    >

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute inset-0 bg-gradient-to-br ${currentScene.tint}`}
        >

          <div
            className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
            style={{ background: currentScene.glowColor }}
          />
          <div
            className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl"
            style={{ background: currentScene.glowColor }}
          />
          <SceneComponent />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur-md">
            <span className="size-2 animate-ping rounded-full bg-red-500" />
            <span className="text-red-400">AI VIDEO DEMO</span>
            <span className="text-white/40">|</span>
            <span className="text-white/80 font-mono">1-MIN SHOWCASE</span>
          </div>
          <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 backdrop-blur-md">
            {currentScene.badge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/10"
            title={muted ? "Unmute Audio" : "Mute Audio"}
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="size-4 text-white/60" /> : <Volume2 className="size-4 text-cyan-400" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/10"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Video"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-4 top-16 z-20 hidden md:flex items-center justify-center gap-1.5">
        {scenes.map((s, idx) => {
          const isActive = idx === sceneIndex;
          const isPassed = (idx + 1) * SCENE_DURATION_SEC <= currentSec;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSeek(idx * SCENE_DURATION_SEC)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wide transition backdrop-blur-md ${isActive
                  ? "border border-cyan-400/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : isPassed
                    ? "border border-white/10 bg-white/10 text-white/80 hover:bg-white/20"
                    : "border border-white/5 bg-black/40 text-white/40 hover:bg-white/10"
                }`}
            >
              {idx + 1}. {s.title.split(" ")[0]} {s.title.split(" ")[1]}
            </button>
          );
        })}
      </div>

      <div className="absolute inset-x-4 bottom-20 z-20 sm:inset-x-8 sm:bottom-24 md:inset-x-12">
        <p className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
          {currentScene.kicker}
        </p>
        <h3 className="mt-1 text-xl font-black leading-tight tracking-tight text-white sm:text-3xl md:text-4xl drop-shadow-md">
          {currentScene.title}
        </h3>
        {!compact && (
          <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-white/80 leading-relaxed drop-shadow">
            {currentScene.subtitle}
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent p-4 sm:p-6 backdrop-blur-md">

        <div className="relative mb-3 flex h-2 w-full gap-1.5 cursor-pointer">
          {scenes.map((s, idx) => {
            const segStart = idx * SCENE_DURATION_SEC;
            const segEnd = (idx + 1) * SCENE_DURATION_SEC;
            let progress = 0;
            if (currentSec >= segEnd) progress = 100;
            else if (currentSec > segStart) {
              progress = ((currentSec - segStart) / SCENE_DURATION_SEC) * 100;
            }

            return (
              <div
                key={s.id}
                onClick={() => handleSeek(segStart)}
                className="group relative h-2 flex-1 overflow-hidden rounded-full bg-white/15 transition hover:h-2.5"
                title={`${s.kicker}: ${s.title}`}
              >
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-9 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause Video" : "Play Video"}
            >
              {isPlaying ? <Pause className="size-4 fill-black" /> : <Play className="size-4 fill-black ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
              title="Restart Video (0:00)"
              aria-label="Restart Video"
            >
              <RotateCcw className="size-3.5" />
            </button>

            <div className="font-mono text-xs font-semibold text-white/90">
              <span className="text-cyan-400">{formattedTime}</span> / {totalFormattedTime}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-white/50">
              Scene {sceneIndex + 1} of {scenes.length}
            </span>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-3.5 py-1.5 text-xs font-bold text-black transition hover:opacity-90"
            >
              Try Every Feature Free <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
