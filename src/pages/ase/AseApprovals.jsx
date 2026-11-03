import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  Mail,
  PauseCircle,
  Phone,
  RotateCw,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../components/ui/toast";
import { aseOperatingApi } from "../../lib/api";

const TABS = [
  { id: "pending", label: "Pending", status: "PENDING" },
  { id: "held", label: "Held", status: "HELD" },
  { id: "approved", label: "Approved", status: "APPROVED" },
  { id: "rejected", label: "Rejected", status: "REJECTED" },
];

const STATUS_STYLE = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-900",
  HELD: "border-slate-300 bg-slate-50 text-slate-700",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  REJECTED: "border-rose-300 bg-rose-50 text-rose-800",
  EXPIRED: "border-slate-300 bg-slate-50 text-slate-600",
};

const label = (value) => String(value || "").replace(/_/g, " ");

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function ApprovalCard({ item, onChanged }) {
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState(null);
  const lead = item.lead || {};
  const draft = item.draft || null;
  const actionable = item.status === "PENDING" || item.status === "HELD";

  const run = async (action, fn, okTitle) => {
    setBusy(action);
    try {
      await fn();
      success(okTitle);
      onChanged();
    } catch (err) {
      toastError("Action failed", err.message);
    } finally {
      setBusy(null);
    }
  };

  const approve = () => {
    const action = label(item.action_type);
    if (!window.confirm(`Approve and run ${action} for ${lead.name || lead.email || `lead #${item.lead_id}`}?`)) {
      return;
    }
    run("approve", () => aseOperatingApi.approveApproval(item.id), `${action} approved`);
  };

  const hold = () =>
    run("hold", () => aseOperatingApi.holdApproval(item.id), "Action held — outreach paused");

  const reject = () => {
    const reason = window.prompt("Reason for rejecting this action?", "");
    if (reason === null) return;
    run("reject", () => aseOperatingApi.rejectApproval(item.id, { reason }), "Action rejected");
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/ase/leads/${item.lead_id}`}
            className="font-semibold text-foreground hover:underline"
          >
            {lead.name || lead.email || `Lead ${item.lead_id}`}
          </Link>
          <div className="text-xs text-muted-foreground truncate">
            {[lead.email, lead.company, lead.phone].filter(Boolean).join(" · ") || `Lead #${item.lead_id}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={STATUS_STYLE[item.status] || ""}>
            {label(item.status)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {item.action_type === "CALL" ? <Phone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
            {label(item.action_type)}
          </Badge>
          {lead.priority != null ? (
            <Badge variant="outline">P{lead.priority}</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Requested</span>
          <div>{formatWhen(item.requested_at)}</div>
        </div>
        <div>
          <span className="font-medium text-foreground">Lead state</span>
          <div>
            {label(lead.status) || "—"}
            {lead.next_action ? ` · next ${label(lead.next_action)}` : ""}
          </div>
        </div>
      </div>

      {item.action_type === "EMAIL" && draft?.subject ? (
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Draft email</div>
          <div className="font-medium">{draft.subject}</div>
          {draft.preview ? (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{draft.preview}</p>
          ) : null}
        </div>
      ) : null}

      {item.payload?.source || item.payload?.reason || item.payload?.reject_reason ? (
        <div className="text-xs text-muted-foreground">
          {item.payload?.reject_reason
            ? `Reject reason: ${item.payload.reject_reason}`
            : item.payload?.reason
              ? `Reason: ${item.payload.reason}`
              : `Source: ${label(item.payload.source)}`}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {actionable ? (
          <>
            <Button size="sm" onClick={approve} disabled={busy !== null}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {busy === "approve" ? "Approving..." : "Approve & run"}
            </Button>
            {item.status === "PENDING" ? (
              <Button size="sm" variant="outline" onClick={hold} disabled={busy !== null}>
                <PauseCircle className="w-4 h-4 mr-1" />
                {busy === "hold" ? "Holding..." : "Hold"}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-700"
              onClick={reject}
              disabled={busy !== null}
            >
              <XCircle className="w-4 h-4 mr-1" />
              {busy === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </>
        ) : null}
        <Button size="sm" variant="outline" asChild>
          <Link to={`/ase/leads/${item.lead_id}`}>Open lead</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AseApprovals() {
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [approvalsRes, modeRes] = await Promise.all([
        aseOperatingApi.listApprovals({ status: tab.status, limit: 100 }),
        aseOperatingApi.getMode().catch(() => null),
      ]);
      const payload = approvalsRes?.data && typeof approvalsRes.data === "object" ? approvalsRes.data : approvalsRes;
      const list = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      setItems(list);
      setCounts(payload?.counts && typeof payload.counts === "object" ? payload.counts : {});
      setMode(modeRes?.mode || modeRes?.data?.mode || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" /> Action Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            AI-Recommended mode queues outbound EMAIL and CALL actions here. Approve to send/dial,
            hold to pause, or reject to stop the recommendation.
          </p>
          {mode ? (
            <p className="text-xs text-muted-foreground mt-2">
              Current operating mode: <span className="font-semibold text-foreground">{label(mode)}</span>
              {String(mode).toUpperCase() !== "AI_RECOMMENDED"
                ? " — pending items still appear if they were queued earlier."
                : null}
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RotateCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={t.id === tab.id ? "default" : "outline"}
            onClick={() => setTab(t)}
          >
            {t.label}
            <span className="ml-2 rounded-full bg-background/30 px-1.5 text-xs">
              {Number(counts[t.status] || 0)}
            </span>
          </Button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50/60 p-6 text-center text-sm text-rose-800">
          {error}
        </div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Loading approvals...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-60" />
          No {tab.label.toLowerCase()} approvals right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {items.map((item) => (
            <ApprovalCard
              key={`${item.id}-${item.status}-${item.updated_at || item.reviewed_at || ""}`}
              item={item}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
