import React, { useEffect, useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { leadApi } from "../../lib/api";

const STATUS_LABEL = {
  EMPTY: "Enter a number",
  VALID: "Valid",
  POSSIBLE: "Possible",
  INVALID: "Invalid",
  MISSING_COUNTRY: "Select a country",
  AMBIGUOUS: "Ambiguous",
  CONFLICT: "Country conflict",
};

export default function InternationalPhoneInput({
  id = "lead-phone",
  label = "Phone",
  value = "",
  country = "",
  confirmConflict = false,
  disabled = false,
  onChange,
}) {
  const [countries, setCountries] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [detection, setDetection] = useState(null);

  useEffect(() => {
    let cancelled = false;
    leadApi
      .listPhoneCountries()
      .then((res) => {
        if (!cancelled) setCountries(res.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!value && !country) {
      setDetection(null);
      return undefined;
    }
    const timer = setTimeout(() => {
      leadApi
        .parsePhone({ phone: value, explicitCountry: country, confirmConflict })
        .then((res) => setDetection(res.data || null))
        .catch(() => {});
    }, 220);
    return () => clearTimeout(timer);
  }, [value, country, confirmConflict]);

  useEffect(() => {
    if (!detection?.country || country) return;
    if (detection.status === "VALID" || detection.status === "POSSIBLE") {
      onChange?.({ phone: value, phoneCountry: detection.country, confirmConflict, detection });
    }
  }, [detection?.country, detection?.status]);

  const selected = countries.find((row) => row.iso === country) || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return countries.slice(0, 12);
    return countries
      .filter((row) =>
        row.name.toLowerCase().includes(needle)
        || row.iso.toLowerCase().includes(needle)
        || row.callingCode.includes(needle.replace("+", ""))
      )
      .slice(0, 12);
  }, [countries, query]);

  const status = detection?.status || (value ? "MISSING_COUNTRY" : "EMPTY");
  const statusClass =
    status === "VALID"
      ? "text-emerald-600"
      : status === "POSSIBLE"
        ? "text-amber-600"
        : status === "EMPTY"
          ? "text-muted-foreground"
          : "text-red-600";

  const emit = (next) => {
    onChange?.({
      phone: next.phone ?? value,
      phoneCountry: next.phoneCountry ?? country,
      confirmConflict: next.confirmConflict ?? confirmConflict,
      detection,
    });
  };

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2">
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-2 text-left text-xs"
          >
            <span className="truncate">
              {selected ? `${selected.iso} +${selected.callingCode}` : "Country"}
            </span>
          </button>
          {open && (
            <div className="absolute z-30 mt-1 w-64 rounded-md border bg-background p-2 shadow-lg">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country"
                className="h-8 text-xs"
              />
              <div className="mt-1 max-h-48 overflow-y-auto">
                {filtered.map((row) => (
                  <button
                    type="button"
                    key={row.iso}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      emit({ phoneCountry: row.iso, confirmConflict: false });
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{row.name}</span>
                    <span className="text-muted-foreground">+{row.callingCode}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder="+447700900123"
          onChange={(e) => emit({ phone: e.target.value, confirmConflict: false })}
        />
      </div>
      <div className={`text-xs ${statusClass}`}>
        {detection?.countryName ? `${detection.countryName} +${detection.callingCode} · ` : null}
        {STATUS_LABEL[status] || status}
        {detection?.e164 ? ` · ${detection.e164}` : null}
      </div>
      {status === "CONFLICT" ? (
        <label className="flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(confirmConflict)}
            onChange={(e) => emit({ confirmConflict: e.target.checked })}
          />
          <span>Keep the international prefix and save this number as {detection?.countryName || detection?.country}.</span>
        </label>
      ) : null}
      {detection?.issues?.[0] && status !== "VALID" && status !== "EMPTY" ? (
        <p className="text-[11px] text-muted-foreground">{detection.issues[0]}</p>
      ) : null}
    </div>
  );
}
