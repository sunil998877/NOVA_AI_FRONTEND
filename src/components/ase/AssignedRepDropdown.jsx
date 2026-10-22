import React, { useState, useRef, useEffect } from "react";
import { User, ChevronDown, Search, Check } from "lucide-react";

const AVATAR_PALETTES = [
  { bg: "bg-sky-100 dark:bg-sky-950/50", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-rose-100 dark:bg-rose-950/50", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-purple-100 dark:bg-purple-950/50", text: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-teal-100 dark:bg-teal-950/50", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-amber-100 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-violet-100 dark:bg-violet-950/50", text: "text-violet-700 dark:text-violet-300" },
];

export default function AssignedRepDropdown({ value, reps = [], onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedRepIndex = reps.findIndex((r) => r.id === value);
  const selectedRep = selectedRepIndex >= 0 ? reps[selectedRepIndex] : null;
  const assignedPalette = selectedRepIndex >= 0 ? AVATAR_PALETTES[selectedRepIndex % AVATAR_PALETTES.length] : null;

  const filteredReps = reps.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.fullName?.toLowerCase().includes(term) ||
      r.role?.toLowerCase().includes(term)
    );
  });

  const handleSelect = (repId) => {
    if (disabled) return;
    onChange(repId);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative inline-block w-fit max-w-[220px]" ref={containerRef}>
      <span className="text-xs text-muted-foreground block mb-1">
        Assigned Rep
      </span>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-8 w-fit min-w-[145px] max-w-[195px] bg-white dark:bg-card border border-purple-500 hover:border-purple-600 dark:border-purple-400 rounded-full px-3 flex items-center justify-between gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedRep ? (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${assignedPalette.bg} ${assignedPalette.text}`}>
              {selectedRep.fullName?.charAt(0).toUpperCase() || "R"}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
              <User className="w-3 h-3" />
            </div>
          )}
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
            {selectedRep ? selectedRep.fullName : "Unassigned"}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-xl shadow-xl p-2 z-50">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-muted/50 border border-slate-200/80 dark:border-border rounded-lg px-2.5 py-1.5 mb-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search representative..."
              className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 w-full"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
            <div
              onClick={() => handleSelect(null)}
              className={`rounded-lg px-2 py-1.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                !value ? "bg-[#F5F3FF] dark:bg-purple-950/40" : "hover:bg-slate-50 dark:hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    !value
                      ? "bg-[#EDE9FE] dark:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs ${!value ? "font-bold text-[#5B21B6] dark:text-purple-300" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                  Unassigned
                </span>
              </div>
              {!value && <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-300 stroke-[2.5]" />}
            </div>

            {filteredReps.map((rep, idx) => {
              const isSelected = value === rep.id;
              const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
              return (
                <div
                  key={rep.id}
                  onClick={() => handleSelect(rep.id)}
                  className={`rounded-lg px-2 py-1.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    isSelected ? "bg-[#F5F3FF] dark:bg-purple-950/40" : "hover:bg-slate-50 dark:hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${palette.bg} ${palette.text}`}>
                      {rep.fullName?.charAt(0).toUpperCase() || "R"}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {rep.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
                        ({rep.role || "ORG_ADMIN"})
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-300 stroke-[2.5]" />}
                </div>
              );
            })}

            {filteredReps.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-400">
                No representatives found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
