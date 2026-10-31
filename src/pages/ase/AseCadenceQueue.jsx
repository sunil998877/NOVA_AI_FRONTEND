import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/ui/toast";
import { cadenceApi } from "../../lib/api";
import { ENROLLMENT_META, QUEUE_FILTER_LABELS, STEP_STATUS_META, formatDue, humanize, stepLabel } from "../../lib/cadence";

const PAGE_SIZE = 50;
const FILTERS = [{ id: "", label: "All open" }, ...Object.entries(QUEUE_FILTER_LABELS).map(([id, label]) => ({ id, label }))];

export default function AseCadenceQueue() {
  const { error: toastError } = useToast();
  const [filter, setFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ items: [], enrollmentCounts: {} });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cadenceApi.queue({ filter: filter || undefined, limit: PAGE_SIZE, offset });
      setData(res?.data || { items: [], enrollmentCounts: {} });
    } catch (err) {
      toastError("Could not load cadence queue", err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, offset, toastError]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const counts = data.enrollmentCounts || {};

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Smart Cadence Queue</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Every scheduled call, retry and follow-up email across leads. Each row is one durable step; the policy engine decides, ML only recommends.
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            {Object.entries(counts).map(([status, total]) => (
              <span key={status} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ENROLLMENT_META[status]?.tone || "bg-muted"}`}>
                {ENROLLMENT_META[status]?.label || humanize(status)}: {total}
              </span>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((item) => (
          <button
            key={item.id || "all"}
            type="button"
            onClick={() => {
              setFilter(item.id);
              setOffset(0);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filter === item.id ? "bg-violet-600 text-white border-violet-600" : "bg-card text-muted-foreground hover:text-foreground border-border"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {["Lead", "Step", "Step status", "Channel", "Due", "Attempts", "Cadence", "Latest outcome"].map((h) => (
                <th key={h} className="text-left font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && data.items.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Nothing in this view.</td></tr>
            )}
            {data.items.map((row) => (
              <tr key={row.id} className="border-t border-border/60 hover:bg-muted/30">
                <td className="px-3 py-2.5 min-w-[180px]">
                  <Link to={`/ase/leads/${row.lead_id}`} className="font-semibold text-foreground hover:underline">{row.lead_name || row.lead_email || `Lead ${row.lead_id}`}</Link>
                  {row.lead_company && <span className="block text-muted-foreground">{row.lead_company}</span>}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{stepLabel(row)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{STEP_STATUS_META[row.status] || humanize(row.status)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[10px]">{row.channel_state || "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{formatDue(row.due_at)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{row.call_attempts ?? 0} calls · {row.email_attempts ?? 0} emails</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ENROLLMENT_META[row.enrollment_status]?.tone || "bg-muted"}`}>
                    {ENROLLMENT_META[row.enrollment_status]?.label || humanize(row.enrollment_status)}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap" title={row.decision_reason || ""}>{humanize(row.latest_outcome) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}>Previous</Button>
        <Button variant="outline" size="sm" disabled={data.items.length < PAGE_SIZE || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</Button>
      </div>
    </div>
  );
}
