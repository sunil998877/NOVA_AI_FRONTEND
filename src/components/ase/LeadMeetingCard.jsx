import React, { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarX, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useToast } from "../ui/toast";
import { meetingApi } from "../../lib/api";

const HANDOFF_META = {
  INTERESTED: { label: "Interested", hint: "Prospect showed interest. No meeting yet.", tone: "border-sky-300 bg-sky-50 text-sky-800" },
  HANDOFF_REQUESTED: { label: "Handoff requested", hint: "A rep should take over. No meeting yet.", tone: "border-sky-300 bg-sky-50 text-sky-800" },
  CALLBACK_PENDING: { label: "Callback pending", hint: "A rep callback is queued. No meeting yet.", tone: "border-amber-300 bg-amber-50 text-amber-800" },
  MEETING_REQUESTED: { label: "Meeting requested", hint: "Collect date, time and timezone to book it.", tone: "border-amber-300 bg-amber-50 text-amber-800" },
  MEETING_PENDING: { label: "Meeting pending", hint: "Time collected; not in the calendar yet.", tone: "border-amber-300 bg-amber-50 text-amber-800" },
  MEETING_BOOKED: { label: "Meeting booked", hint: "Confirmed in the rep's calendar.", tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  BOOKING_FAILED: { label: "Booking failed", hint: "The calendar booking did not go through.", tone: "border-rose-300 bg-rose-50 text-rose-800" },
  MEETING_CANCELLED: { label: "Meeting cancelled", hint: "The meeting was cancelled.", tone: "border-slate-300 bg-slate-50 text-slate-700" },
};

const OPEN = new Set(["MEETING_REQUESTED", "MEETING_PENDING", "MEETING_BOOKED", "BOOKING_FAILED"]);
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function formatWhen(value, timezone) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, { timeZone: timezone || undefined, dateStyle: "medium", timeStyle: "short" });
  } catch {
    return new Date(value).toLocaleString();
  }
}

export default function LeadMeetingCard({ lead }) {
  const { success, error: toastError } = useToast();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(null);
  const [start, setStart] = useState("");
  const [timezone, setTimezone] = useState(browserZone());
  const [duration, setDuration] = useState(30);

  const load = useCallback(async () => {
    if (!lead?.id) return;
    try {
      const res = await meetingApi.forLead(lead.id);
      setState(res.data);
    } catch (err) {
      setState({ error: err.message });
    }
  }, [lead?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const meeting = (state?.meetings || []).find((m) => OPEN.has(m.status)) || null;
  const handoff = HANDOFF_META[state?.handoffStatus] || null;

  const run = async (action, fn, okTitle) => {
    setBusy(action);
    try {
      await fn();
      success(okTitle);
    } catch (err) {
      toastError("Meeting", err.message);
    } finally {
      setBusy(null);
      load();
    }
  };

  const prefs = { preferredStart: start, timezone, durationMinutes: Number(duration) || 30 };
  const canSetTime = meeting && ["MEETING_REQUESTED", "MEETING_PENDING", "BOOKING_FAILED"].includes(meeting.status);
  const canBook = meeting && ["MEETING_PENDING", "BOOKING_FAILED"].includes(meeting.status) && meeting.preferred_start;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="w-4 h-4" /> Handoff & meeting
        </CardTitle>
        <CardDescription>A meeting shows as booked only after the calendar confirms the event.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {state?.error && <div className="text-xs text-rose-700">{state.error}</div>}
        <div className="flex flex-wrap items-center gap-2">
          {handoff ? (
            <>
              <Badge variant="outline" className={handoff.tone}>{handoff.label}</Badge>
              <span className="text-xs text-muted-foreground">{handoff.hint}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No handoff yet.</span>
          )}
        </div>

        {meeting ? (
          <div className="rounded-lg border p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{meeting.title || "Sales meeting"}</span>
              <Badge variant="outline" className={HANDOFF_META[meeting.status]?.tone}>{HANDOFF_META[meeting.status]?.label}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {meeting.status === "MEETING_BOOKED"
                ? `Booked for ${formatWhen(meeting.start_at, meeting.timezone)} (${meeting.timezone})`
                : meeting.preferred_start
                  ? `Requested time ${formatWhen(meeting.preferred_start, meeting.timezone)} (${meeting.timezone})`
                  : "No date or time collected yet"}
            </div>
            {meeting.preferred_text && <div className="text-xs">{meeting.preferred_text}</div>}
            {meeting.last_error && <div className="text-xs text-rose-700">Last error: {meeting.last_error}</div>}
            {meeting.calendar_event_link && (
              <a className="text-xs text-primary inline-flex items-center gap-1" href={meeting.calendar_event_link} target="_blank" rel="noreferrer">
                Open calendar event <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run("request", () => meetingApi.request(lead.id, {}), "Meeting request created")}>
            Create meeting request
          </Button>
        )}

        {meeting && meeting.status !== "MEETING_CANCELLED" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Meeting date and time" />
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Timezone, e.g. Asia/Kolkata" aria-label="Timezone" />
            <Input type="number" min={10} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} aria-label="Duration in minutes" />
          </div>
        )}

        {meeting && (
          <div className="flex flex-wrap gap-2">
            {canSetTime && (
              <Button size="sm" variant="outline" disabled={!start || busy !== null} onClick={() => run("prefs", () => meetingApi.setPreferences(meeting.id, prefs), "Meeting time saved (pending booking)")}>
                Save time
              </Button>
            )}
            {canBook && (
              <Button size="sm" disabled={busy !== null} onClick={() => run("book", () => meetingApi.book(meeting.id), "Meeting booked in calendar")}>
                {busy === "book" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CalendarCheck className="w-4 h-4 mr-1" />}
                Book in calendar
              </Button>
            )}
            {meeting.status === "MEETING_BOOKED" && (
              <Button size="sm" variant="outline" disabled={!start || busy !== null} onClick={() => run("reschedule", () => meetingApi.reschedule(meeting.id, prefs), "Meeting rescheduled")}>
                Reschedule
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-700"
              disabled={busy !== null}
              onClick={() => {
                const reason = window.prompt("Reason for cancelling?", "");
                if (reason === null) return;
                run("cancel", () => meetingApi.cancel(meeting.id, reason), "Meeting cancelled");
              }}
            >
              <CalendarX className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
