import React, { useMemo } from "react";
import { mergeNbaDecision, presentNba } from "../../lib/presentNextBestAction";
import LeadNextActionButtons from "./LeadNextActionButtons";

function countTouchpoints(lead, timeline, metrics) {
  const rawCounters = lead?.attempt_counters;
  const counters = typeof rawCounters === "string"
    ? (() => { try { return JSON.parse(rawCounters); } catch { return {}; } })()
    : (rawCounters || {});
  const events = Array.isArray(timeline) ? timeline : [];
  const emailsFromTimeline = events.filter((event) => {
    const type = String(event.event_type || "");
    const channel = String(event.channel || "").toUpperCase();
    return type === "EMAIL_SENT" || type === "DELIVERY_CONFIRMED" || (type === "ActionCompleted" && channel === "EMAIL");
  }).length;
  const callsFromTimeline = events.filter((event) => {
    const type = String(event.event_type || "");
    const channel = String(event.channel || "").toUpperCase();
    return channel === "VOICE" || type === "VOICE_CALL" || type === "OUTBOUND_CALL" || type === "CallDispatched" || type === "CALL_COMPLETED";
  }).length;
  const emails = Math.max(Number(counters.email || 0), Number(metrics?.emailAttempts || 0), emailsFromTimeline);
  const calls = Math.max(Number(counters.voice || 0), Number(metrics?.voiceAttempts || 0), callsFromTimeline);
  return { emails, calls };
}

function conversionView(decision) {
  const source = decision?.conversionPrediction?.probability ?? decision?.conversionProbability;
  const raw = source != null
    ? (Number(source) > 1 ? Number(source) / 100 : Number(source))
    : 0;
  const pct = (raw * 100).toFixed(1);
  const tone = Number(pct) >= 20
    ? "Promising — prioritize"
    : Number(pct) >= 8
      ? "Moderate — stay on it"
      : "Low — keep nurturing";
  return { pct, tone };
}

function confidenceLabel(nba, decision) {
  const percents = nba.percents;
  if (percents.hasData && nba.rightWinner === "EMAIL") return percents.email;
  if (percents.hasData && nba.rightWinner === "CALL") return percents.call;
  const raw = Number(decision?.confidence);
  if (!Number.isFinite(raw) || raw <= 0) return percents.hasData ? percents.email : 98;
  return Math.round(raw > 1 ? raw : raw * 100);
}

function modeCaption(mode) {
  if (mode === "AI_RECOMMENDED") return "Needs approval";
  if (mode === "HUMAN_ESCALATION") return "Human escalation";
  return "Fully automated";
}

export default function NextBestActionCard({
  lead,
  brainDecision,
  timeline = [],
  operatingMode = "FULLY_AUTOMATED",
  pendingApproval = null,
  nbaFromApi = null,
  updating = false,
  onBusy,
  onHold,
  onPreview,
  onExecuted,
  onOpenCallbacks,
  onChooseAnother,
  onError,
}) {
  const decision = useMemo(
    () => mergeNbaDecision(lead, brainDecision, timeline),
    [lead, brainDecision, timeline]
  );
  const nba = useMemo(
    () => presentNba({
      lead,
      decision,
      cadenceStep: nbaFromApi?.cadenceStep || null,
      operatingMode,
      pendingApproval,
    }),
    [lead, decision, nbaFromApi, operatingMode, pendingApproval]
  );
  const conversion = conversionView(decision);
  const touchpoints = countTouchpoints(lead, timeline, decision.supportingMetrics);
  const confidencePct = confidenceLabel(nba, decision);
  const { email: emailPct, wait: waitPct, call: callPct, hasData } = nba.percents;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
      <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-gray-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#ffedd5] text-[#c2410c]">
              Recommended next step
            </span>
            <span className="text-xs text-gray-500 dark:text-muted-foreground font-normal">
              {modeCaption(operatingMode)}
              {" · "}
              {Number.isFinite(confidencePct) ? confidencePct : 98}% confidence
            </span>
            {pendingApproval?.status === "PENDING" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800">
                Pending approval
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">
            {nba.heading}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
            {nba.subline}
          </p>
          <LeadNextActionButtons
            leadId={lead.id}
            recommendedAction={nba.channel}
            due={nba.due}
            primaryLabel={nba.primaryLabel}
            operatingMode={operatingMode}
            pendingApproval={pendingApproval}
            doNotContact={lead.do_not_contact}
            updating={updating}
            onBusy={onBusy}
            onHold={onHold}
            onPreview={onPreview}
            onExecuted={onExecuted}
            onOpenCallbacks={onOpenCallbacks}
            onChooseAnother={onChooseAnother}
            onError={onError}
          />

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-gray-50/80 dark:bg-muted/40 p-2.5 border border-gray-100 dark:border-border/60">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                Timing
              </span>
              <span className="font-semibold text-gray-800 dark:text-foreground mt-0.5 block truncate">
                {nba.waitLine}
              </span>
            </div>
            <div className="rounded-xl bg-gray-50/80 dark:bg-muted/40 p-2.5 border border-gray-100 dark:border-border/60">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                Touchpoint History
              </span>
              <span className="font-semibold text-gray-800 dark:text-foreground mt-0.5 block truncate">
                {touchpoints.emails} {touchpoints.emails === 1 ? "Email" : "Emails"} · {touchpoints.calls} {touchpoints.calls === 1 ? "Call" : "Calls"}
              </span>
            </div>
            <div className="rounded-xl bg-gray-50/80 dark:bg-muted/40 p-2.5 border border-gray-100 dark:border-border/60">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                Cadence
              </span>
              <span className="font-semibold text-gray-800 dark:text-foreground mt-0.5 block truncate">
                {nba.cadenceStep}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <div className="border-t border-gray-100 dark:border-border/60 mb-3" />
          <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm">
            <span className="font-bold text-gray-900 dark:text-foreground">Why this?</span>
            {(decision.reasonCodes?.length ? decision.reasonCodes : ["Model decision"]).slice(0, 3).map((code) => (
              <span key={code} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground">
                {String(code).replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-gray-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-muted-foreground">
            Conversion chance, next 14 days
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl sm:text-[34px] font-bold tracking-tight text-gray-900 dark:text-foreground leading-none">
              {conversion.pct}%
            </span>
            <span className="text-xs text-gray-500 dark:text-muted-foreground font-normal">
              {conversion.tone}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-gray-100 dark:bg-muted rounded-full relative overflow-hidden">
            <div
              className="h-full rounded-full bg-[#ea580c]"
              style={{ width: `${Math.max(2, Math.min(100, Number(conversion.pct)))}%` }}
            />
          </div>

          <div className="mt-4 text-xs font-semibold text-gray-700 dark:text-foreground">
            Model&apos;s channel preference
          </div>
          <div className="mt-2 space-y-2">
            {[
              { key: "EMAIL", label: "Email", value: emailPct, bar: "bg-[#2563eb]", text: "text-[#2563eb]" },
              { key: "WAIT", label: "Wait", value: waitPct, bar: "bg-[#d97706]", text: "text-[#d97706]" },
              { key: "CALL", label: "AI voice call", value: callPct, bar: "bg-[#7c3aed]", text: "text-[#7c3aed]" },
            ].map((row) => {
              const isWinner = nba.rightWinner === row.key && hasData;
              return (
                <div key={row.key}>
                  <div className={`flex items-center justify-between text-xs ${isWinner ? `font-semibold ${row.text}` : "font-normal text-gray-600 dark:text-muted-foreground"}`}>
                    <span>{row.label}</span>
                    <span className={isWinner ? `font-bold ${row.text}` : ""}>{row.value}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.bar}`}
                      style={{ width: `${Math.max(row.value > 0 ? 2 : 0, Math.min(100, row.value))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3.5 text-[11px] text-gray-400 font-normal">
          Channel is the action. Wait is only timing.
        </div>
      </div>
    </div>
  );
}
