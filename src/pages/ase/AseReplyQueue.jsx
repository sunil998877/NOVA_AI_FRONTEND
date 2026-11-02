import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Inbox, Mail, RotateCw, Send, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/toast";
import { replyDraftApi } from "../../lib/api";

const TABS = [
  { id: "review", label: "Needs review", status: "PENDING_APPROVAL,NEEDS_HUMAN_REVIEW" },
  { id: "approved", label: "Approved", status: "APPROVED" },
  { id: "problems", label: "Send problems", status: "SEND_FAILED,SEND_UNKNOWN" },
  { id: "sent", label: "Sent", status: "SENT" },
  { id: "closed", label: "Rejected / cancelled", status: "REJECTED,CANCELLED" },
];

const STATUS_STYLE = {
  PENDING_APPROVAL: "border-sky-300 bg-sky-50 text-sky-800",
  NEEDS_HUMAN_REVIEW: "border-amber-300 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  SENDING: "border-sky-300 bg-sky-50 text-sky-800",
  SENT: "border-emerald-300 bg-emerald-50 text-emerald-800",
  SEND_FAILED: "border-rose-300 bg-rose-50 text-rose-800",
  SEND_UNKNOWN: "border-rose-300 bg-rose-50 text-rose-800",
  REJECTED: "border-slate-300 bg-slate-50 text-slate-700",
  CANCELLED: "border-slate-300 bg-slate-50 text-slate-700",
};

const label = (value) => String(value || "").replace(/_/g, " ").toLowerCase();

function DraftCard({ draft, onChanged }) {
  const { success, error: toastError } = useToast();
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body_text || "");
  const [acknowledge, setAcknowledge] = useState(false);
  const [busy, setBusy] = useState(null);
  const dirty = subject !== (draft.subject || "") || body !== (draft.body_text || "");
  const issues = draft.guard_issues || [];
  const flags = draft.inbound_review_flags || draft.grounding?.reviewFlags || [];
  const editable = ["PENDING_APPROVAL", "NEEDS_HUMAN_REVIEW", "APPROVED", "SEND_FAILED"].includes(draft.status);
  const reviewable = ["PENDING_APPROVAL", "NEEDS_HUMAN_REVIEW"].includes(draft.status);
  const sendable = ["APPROVED", "SEND_FAILED", "SEND_UNKNOWN"].includes(draft.status);

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

  const save = () => run("save", () => replyDraftApi.edit(draft.id, { subject, bodyText: body }), "Draft saved; it needs approval again");
  const approve = () => run("approve", () => replyDraftApi.approve(draft.id, { acknowledgeIssues: acknowledge }), "Reply approved");
  const reject = () => {
    const reason = window.prompt("Reason for rejecting this reply?", "");
    if (reason === null) return;
    run("reject", () => replyDraftApi.reject(draft.id, reason), "Reply rejected");
  };
  const send = () => {
    let confirmResend = false;
    if (draft.status === "SEND_UNKNOWN") {
      confirmResend = window.confirm("The last attempt may already have been delivered. Check the mailbox first. Send again anyway?");
      if (!confirmResend) return;
    } else if (!window.confirm(`Send this reply to ${draft.lead_email}?`)) {
      return;
    }
    run("send", () => replyDraftApi.send(draft.id, { confirmResend }), "Reply sent");
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/ase/leads/${draft.lead_id}`} className="font-semibold text-foreground hover:underline">
            {draft.lead_name || draft.lead_email || `Lead ${draft.lead_id}`}
          </Link>
          <div className="text-xs text-muted-foreground truncate">
            {draft.lead_email}{draft.lead_company ? ` · ${draft.lead_company}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={STATUS_STYLE[draft.status] || ""}>{label(draft.status)}</Badge>
          <Badge variant="secondary">{label(draft.intent)}</Badge>
          {flags.map((flag) => (
            <Badge key={flag} variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" />{label(flag)}</Badge>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Prospect wrote{draft.inbound_received_at ? ` · ${new Date(draft.inbound_received_at).toLocaleString()}` : ""}
        </div>
        <div className="font-medium">{draft.inbound_subject}</div>
        <p className="whitespace-pre-wrap text-foreground/90 max-h-40 overflow-auto">{draft.inbound_body}</p>
      </div>

      {draft.review_reason && (
        <div className="flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{draft.review_reason}</span>
        </div>
      )}
      {issues.length > 0 && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-md p-2">
          Guard issues: {issues.map(label).join(", ")}. Edit the reply or explicitly acknowledge before approving.
        </div>
      )}

      <div className="space-y-2">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!editable} placeholder="Subject" />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!editable}
          rows={7}
          placeholder={draft.status === "NEEDS_HUMAN_REVIEW" && !draft.body_text ? "This reply needs a human-written response." : "Reply"}
        />
      </div>

      {draft.send_error && <div className="text-xs text-rose-700">Last send error: {draft.send_error}</div>}
      {draft.reject_reason && draft.status !== "SENT" && <div className="text-xs text-muted-foreground">Note: {draft.reject_reason}</div>}

      <div className="flex flex-wrap items-center gap-2">
        {editable && (
          <Button size="sm" variant="outline" onClick={save} disabled={!dirty || busy !== null}>
            {busy === "save" ? "Saving..." : "Save edit"}
          </Button>
        )}
        {reviewable && (
          <>
            {issues.length > 0 && !dirty && (
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} />
                I checked the flagged issues
              </label>
            )}
            <Button size="sm" onClick={approve} disabled={dirty || busy !== null || !body.trim() || (issues.length > 0 && !acknowledge)}>
              <CheckCircle2 className="w-4 h-4 mr-1" />{busy === "approve" ? "Approving..." : "Approve"}
            </Button>
          </>
        )}
        {sendable && (
          <Button size="sm" onClick={send} disabled={dirty || busy !== null}>
            <Send className="w-4 h-4 mr-1" />{busy === "send" ? "Sending..." : draft.status === "APPROVED" ? "Send" : "Retry send"}
          </Button>
        )}
        {(reviewable || sendable) && (
          <Button size="sm" variant="ghost" className="text-rose-700" onClick={reject} disabled={busy !== null}>
            <XCircle className="w-4 h-4 mr-1" />Reject
          </Button>
        )}
        {dirty && <span className="text-xs text-muted-foreground">Save your edit before approving or sending.</span>}
      </div>
    </div>
  );
}

export default function AseReplyQueue() {
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await replyDraftApi.list({ status: tab.status, limit: 100 });
      const payload = res?.data && typeof res.data === "object" ? res.data : res;
      const list = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.drafts)
          ? payload.drafts
          : Array.isArray(payload)
            ? payload
            : [];
      setItems(list);
      setCounts(payload?.counts && typeof payload.counts === "object" ? payload.counts : {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const countFor = (t) => t.status.split(",").reduce((sum, s) => sum + Number(counts[s] || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="w-7 h-7 text-primary" /> Reply Approval Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            AI-drafted answers to prospect replies. Nothing is sent until a team member approves and sends it.
            Opt-outs are suppressed automatically and never get a reply.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RotateCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.id} size="sm" variant={t.id === tab.id ? "default" : "outline"} onClick={() => setTab(t)}>
            {t.label}
            <span className="ml-2 rounded-full bg-background/30 px-1.5 text-xs">{countFor(t)}</span>
          </Button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50/60 p-6 text-center text-sm text-rose-800">{error}</div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Loading replies...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-60" />No replies in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {(Array.isArray(items) ? items : []).map((draft) => (
            <DraftCard key={`${draft.id}-${draft.status}-${draft.updated_at}`} draft={draft} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
