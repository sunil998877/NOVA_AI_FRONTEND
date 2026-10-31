import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";
import { cadenceApi } from "../../lib/api";
import { PURPOSE_LABELS } from "../../lib/cadence";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const selectClass = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function WindowEditor({ label, value, onChange }) {
  const days = new Set(value?.days || []);
  const toggle = (day) => {
    const next = new Set(days);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange({ ...value, days: [...next].sort((a, b) => a - b) });
  };
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <Input type="number" min={0} max={23} className="h-9 w-20" value={value?.startHour ?? 9} onChange={(e) => onChange({ ...value, startHour: Number(e.target.value) })} />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="number" min={1} max={24} className="h-9 w-20" value={value?.endHour ?? 20} onChange={(e) => onChange({ ...value, endHour: Number(e.target.value) })} />
        <span className="text-xs text-muted-foreground">lead's local time</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {DAYS.map((name, day) => (
          <button
            key={name}
            type="button"
            onClick={() => toggle(day)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${days.has(day) ? "bg-violet-600 text-white border-violet-600" : "text-muted-foreground border-border"}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CadencePolicySettings() {
  const { success, error: toastError } = useToast();
  const [policy, setPolicy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await cadenceApi.getDefaultPolicy();
      setPolicy(res?.data || null);
      setSettings(res?.data?.settings || null);
      setErrors([]);
    } catch (err) {
      toastError("Could not load cadence policy", err.message);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const setStepDay = (index, day) => setSettings((prev) => ({
    ...prev,
    followUpSteps: prev.followUpSteps.map((step, i) => (i === index ? { ...step, day: Number(day) } : step)),
  }));

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await cadenceApi.updatePolicy(policy.id, { settings, version: policy.version });
      setPolicy(res?.data || policy);
      setSettings(res?.data?.settings || settings);
      success("Cadence policy saved", "New enrollments use this policy; running cadences keep the version they started with.");
    } catch (err) {
      if (err.status === 409) {
        toastError("Policy changed elsewhere", "Reloaded the latest version. Re-apply your changes.");
        await load();
      } else {
        setErrors(err?.payload?.details?.errors || [err.message]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader><CardTitle>Smart Call Cadence</CardTitle></CardHeader>
        <CardContent><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></CardContent>
      </Card>
    );
  }

  const minutesToHours = (m) => Math.round((Number(m) / 60) * 100) / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Call Cadence</CardTitle>
        <CardDescription>
          Retry, missed-call email and follow-up rules for autonomous calls. Policy v{policy.version}. Consent, DNC and suppression are always enforced.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Initial call attempts" hint="First call plus retries before the missed-call email">
            <Input type="number" min={1} max={5} value={settings.maxInitialCallAttempts} onChange={(e) => set("maxInitialCallAttempts", Number(e.target.value))} />
          </Field>
          <Field label="Retry after no answer (hours)">
            <Input type="number" min={0.25} step={0.25} value={minutesToHours(settings.retryIntervalMinutes)} onChange={(e) => set("retryIntervalMinutes", Math.round(Number(e.target.value) * 60))} />
          </Field>
          <Field label="Retry after busy (hours)">
            <Input type="number" min={0.25} step={0.25} value={minutesToHours(settings.busyRetryIntervalMinutes)} onChange={(e) => set("busyRetryIntervalMinutes", Math.round(Number(e.target.value) * 60))} />
          </Field>
          <Field label="Missed-call email delay (minutes after retry)">
            <Input type="number" min={0} value={settings.emailAfterRetryDelayMinutes} onChange={(e) => set("emailAfterRetryDelayMinutes", Number(e.target.value))} />
          </Field>
          <Field label="Email approval" hint="Auto sends only when Operating Mode is Fully Automated and the draft passed every check">
            <select className={selectClass} value={settings.emailApprovalMode} onChange={(e) => set("emailApprovalMode", e.target.value)}>
              <option value="MANUAL">Manual approval</option>
              <option value="AUTO">Auto send</option>
            </select>
          </Field>
          <Field label="When a voicemail answers">
            <select className={selectClass} value={settings.voicemailAction} onChange={(e) => set("voicemailAction", e.target.value)}>
              <option value="EMAIL">Follow up by email</option>
              <option value="RETRY">Retry the call</option>
              <option value="HUMAN_REVIEW">Send to human review</option>
            </select>
          </Field>
          <Field label="Max calls per cadence">
            <Input type="number" min={1} max={10} value={settings.maxTotalCalls} onChange={(e) => set("maxTotalCalls", Number(e.target.value))} />
          </Field>
          <Field label="Max emails per cadence">
            <Input type="number" min={0} max={10} value={settings.maxTotalEmails} onChange={(e) => set("maxTotalEmails", Number(e.target.value))} />
          </Field>
          <Field label="Fallback timezone" hint="Used when the lead has no timezone (default Asia/Kolkata)">
            <Input placeholder="Asia/Kolkata" value={settings.timezone || ""} onChange={(e) => set("timezone", e.target.value.trim() || null)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WindowEditor label="Calling hours" value={settings.callingWindow} onChange={(v) => set("callingWindow", v)} />
          <WindowEditor label="Email sending hours" value={settings.emailWindow} onChange={(v) => set("emailWindow", v)} />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-semibold">Follow-up plan after the missed-call email</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {settings.followUpSteps.map((step, index) => (
              <div key={step.key} className="rounded-lg border border-border px-2.5 py-2 space-y-1">
                <span className="block text-[11px] font-semibold">{PURPOSE_LABELS[step.purpose] || step.action}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Day</span>
                  <Input type="number" min={1} max={60} className="h-8 w-16" value={step.day} onChange={(e) => setStepDay(index, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <Field label="At the end of the plan">
            <select className={`${selectClass} md:w-64`} value={settings.closeOutcome} onChange={(e) => set("closeOutcome", e.target.value)}>
              <option value="NURTURE">Move to nurture</option>
              <option value="CLOSED_LOST">Close as lost</option>
            </select>
          </Field>
        </div>

        {errors.length > 0 && (
          <ul className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 list-disc pl-6">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={load} disabled={saving}>Reset</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save cadence policy"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
