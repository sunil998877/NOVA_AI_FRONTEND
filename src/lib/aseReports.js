export function reportToCsv(report = {}) {
  const rows = [
    ["metric", "value"],
    ["speed_to_lead_minutes", report.speedToLeadMinutes ?? ""],
    ["contacted_count", report.contactedCount ?? 0],
    ["email_sent", report.email?.sent ?? 0],
    ["email_opened", report.email?.opened ?? 0],
    ["email_replied", report.email?.replied ?? 0],
    ["email_interested", report.email?.interested ?? 0],
    ["email_meetings", report.email?.meetings ?? 0],
    ["email_response_rate", report.email?.responseRate ?? 0],
    ["voice_dials", report.voice?.dials ?? 0],
    ["voice_connected", report.voice?.connected ?? 0],
    ["voice_callbacks", report.voice?.callbacks ?? 0],
    ["voice_interested", report.voice?.interested ?? 0],
    ["voice_meetings", report.voice?.meetings ?? 0],
    ["voice_connect_rate", report.voice?.connectRate ?? 0],
    ["callback_total", report.callbacks?.total ?? 0],
    ["callback_completed", report.callbacks?.completed ?? 0],
    ["callback_sla_met", report.callbacks?.met ?? 0],
    ["callback_sla_rate", report.callbacks?.slaRate ?? 0],
    ["outcomes_interested", report.outcomes?.interested ?? 0],
    ["outcomes_meetings", report.outcomes?.meetings ?? 0],
  ];
  return rows.map((row) => row.join(",")).join("\n");
}

export function complianceToCsv(rows = []) {
  const header = ["kind", "created_at", "lead_id", "channel", "status", "reason"];
  const lines = [header.join(",")];
  for (const row of rows) {
    const values = [
      row.kind || "",
      row.created_at ? new Date(row.created_at).toISOString() : "",
      row.lead_id ?? "",
      row.channel ?? "",
      row.status ?? row.event_type ?? "",
      String(row.reason || row.source || "").replace(/"/g, '""'),
    ];
    lines.push(values.map((value) => `"${value}"`).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function segmentLeadsHref(segment) {
  const query = new URLSearchParams(segment?.query || {});
  const qs = query.toString();
  return qs ? `/ase/leads?${qs}` : "/ase/leads";
}
