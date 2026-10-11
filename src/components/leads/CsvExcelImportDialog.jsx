import React, { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Check,
  X,
  FileCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useToast } from "../ui/toast";
import { leadApi } from "../../lib/api";
import {
  parseFileToLeads,
  SCHEMA_TARGET_FIELDS,
  autoDetectMapping,
} from "../../utils/sheetParser";

export default function CsvExcelImportDialog({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [duplicateStrategy, setDuplicateStrategy] = useState("update");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const { success, error: toastError } = useToast();

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParseLoading(true);
    setSummary(null);

    try {
      const data = await parseFileToLeads(selected);
      setParsedData(data);
      const initialMap = autoDetectMapping(data.headers);
      setMapping(initialMap);
      setStep(2);
    } catch (err) {
      toastError("Failed to Read File", err.message || "Invalid file format");
      setFile(null);
      setParsedData(null);
    } finally {
      setParseLoading(false);
    }
  };

  const handleMapChange = (header, targetField) => {
    setMapping((prev) => ({
      ...prev,
      [header]: targetField,
    }));
  };

  const isEmailMapped = Object.values(mapping).some((f) => f === "email");

  const handleExecuteImport = async () => {
    if (!parsedData || !isEmailMapped) {
      toastError("Mapping Incomplete", "Please map at least one column to 'Email Address'");
      return;
    }

    setImporting(true);
    try {
      const res = await leadApi.importCsv({
        csv: parsedData.csvText,
        columnMap: mapping,
        updateExisting: duplicateStrategy === "update",
      });

      const resultData = res.data || { created: 0, updated: 0, skipped: 0, errors: [] };
      setSummary(resultData);
      setStep(4);
      success(
        "Import Successful",
        `Created ${resultData.created || 0}, Updated ${resultData.updated || 0}, Skipped ${resultData.skipped || 0} leads.`
      );
      if (onSuccess) onSuccess();
    } catch (err) {
      toastError("Import Failed", err.message || "Failed to process lead ingestion");
    } finally {
      setImporting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setFile(null);
    setParsedData(null);
    setMapping({});
    setSummary(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAll();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle>Import Leads (CSV / Excel)</DialogTitle>
              <DialogDescription>
                Bulk import contacts from CSV or Excel spreadsheets with schema column mapping & deduplication.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step progress pills */}
        <div className="grid grid-cols-4 gap-2 py-2 border-b text-xs">
          {[
            { num: 1, label: "Upload File" },
            { num: 2, label: "Column Mapping" },
            { num: 3, label: "Strategy & Rules" },
            { num: 4, label: "Summary" },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 p-2 rounded-md font-medium transition-colors ${
                step === s.num
                  ? "bg-primary text-primary-foreground"
                  : step > s.num
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground bg-muted/30"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-[10px]">
                {step > s.num ? <Check className="h-3 w-3" /> : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 rounded-xl p-8 text-center transition-all bg-muted/10 hover:bg-muted/30">
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                className="hidden"
                id="leads-spreadsheet-upload"
                onChange={handleFileChange}
                disabled={parseLoading}
              />
              <Label
                htmlFor="leads-spreadsheet-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full shadow-inner">
                  {parseLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-base">
                    {parseLoading ? "Parsing spreadsheet..." : "Choose a file or drag & drop"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports <strong>CSV (.csv)</strong>, <strong>Excel (.xlsx, .xls)</strong>, and <strong>TSV (.tsv)</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className="text-xs bg-background">
                    Max 5MB
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-background">
                    Auto Delimiter Detection
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-background">
                    Multi-sheet Excel
                  </Badge>
                </div>
              </Label>
            </div>
          </div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 2 && parsedData && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium truncate max-w-xs">{file?.name}</span>
                {parsedData.sheetName && (
                  <Badge variant="secondary" className="text-[10px]">
                    Sheet: {parsedData.sheetName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{parsedData.totalRows} data rows detected</span>
                <span>•</span>
                <span>{parsedData.headers.length} columns</span>
              </div>
            </div>

            {!isEmailMapped && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-900 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>You must map at least one column to <strong>Email Address</strong> to proceed.</span>
              </div>
            )}

            <div className="max-h-72 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="font-semibold">File Column (Detected)</TableHead>
                    <TableHead className="font-semibold">Lead Schema Target Field</TableHead>
                    <TableHead className="font-semibold">Sample Value (Row 1)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.headers.map((header, idx) => {
                    const sampleVal = parsedData.rows[0]?.[idx] || "—";
                    const currentTarget = mapping[header] || "ignore";
                    const isRequiredField = currentTarget === "email";

                    return (
                      <TableRow key={header} className="text-xs">
                        <TableCell className="font-medium font-mono text-xs">
                          {header}
                        </TableCell>
                        <TableCell>
                          <select
                            value={currentTarget}
                            onChange={(e) => handleMapChange(header, e.target.value)}
                            className={`w-full text-xs rounded-md border px-2.5 py-1.5 bg-background shadow-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                              isRequiredField ? "border-emerald-500 font-semibold text-emerald-700 dark:text-emerald-300" : ""
                            }`}
                          >
                            <option value="ignore">— Ignore Column —</option>
                            {SCHEMA_TARGET_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} {f.required ? "★ (Required)" : ""}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs font-mono text-[11px]">
                          {sampleVal}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Quick Preview Table */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Live Data Preview (First 3 Rows)
              </span>
              <div className="overflow-x-auto border rounded-md max-h-32">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 text-[11px]">
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.slice(0, 3).map((row, rIdx) => {
                      const getMappedVal = (field) => {
                        const h = Object.keys(mapping).find((k) => mapping[k] === field);
                        if (!h) return "—";
                        const colIdx = parsedData.headers.indexOf(h);
                        return row[colIdx] || "—";
                      };

                      return (
                        <TableRow key={rIdx} className="text-[11px]">
                          <TableCell className="font-medium text-emerald-600">{getMappedVal("email")}</TableCell>
                          <TableCell>{getMappedVal("name") || `${getMappedVal("firstName")} ${getMappedVal("lastName")}`.trim() || "—"}</TableCell>
                          <TableCell>{getMappedVal("company")}</TableCell>
                          <TableCell>{getMappedVal("phone")}</TableCell>
                          <TableCell>{getMappedVal("priority")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Deduplication Strategy */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <h4 className="font-semibold text-sm">Deduplication & Intake Policies</h4>
              <p className="text-xs text-muted-foreground">
                Configure how matching records are handled upon ingestion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div
                onClick={() => setDuplicateStrategy("update")}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  duplicateStrategy === "update"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">Update Existing Leads</div>
                  <Badge variant={duplicateStrategy === "update" ? "default" : "outline"} className="text-[10px]">
                    Recommended
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  If an email or phone already exists in this organization, update attributes (name, company, priority) while preserving active lifecycle state.
                </p>
              </div>

              <div
                onClick={() => setDuplicateStrategy("skip")}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  duplicateStrategy === "skip"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">Skip Duplicates</div>
                  <Badge variant="outline" className="text-[10px]">Strict</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Only ingest brand new leads. Any contact with an existing email address will be safely ignored.
                </p>
              </div>
            </div>

            <Card className="border border-emerald-500/30 bg-emerald-50/10">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                    Automatic Compliance Screening (DNC)
                  </span>
                  <p className="text-muted-foreground">
                    All ingested contacts are automatically screened in real-time against your organization's Do-Not-Contact (DNC) registry and bounce suppression list before saving.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 4: Summary */}
        {step === 4 && summary && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Leads Ingestion Complete</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Records have been processed into the Lead Store and queued for autonomous cadence.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 border rounded-lg bg-emerald-50/30 dark:bg-emerald-950/20">
                <div className="text-2xl font-bold text-emerald-600">{summary.created || 0}</div>
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Created</div>
              </div>
              <div className="p-3 border rounded-lg bg-blue-50/30 dark:bg-blue-950/20">
                <div className="text-2xl font-bold text-blue-600">{summary.updated || 0}</div>
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Updated</div>
              </div>
              <div className="p-3 border rounded-lg bg-slate-50/30 dark:bg-slate-900/20">
                <div className="text-2xl font-bold text-slate-600">{summary.skipped || 0}</div>
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Skipped</div>
              </div>
            </div>

            {summary.errors && summary.errors.length > 0 && (
              <div className="p-3 border border-rose-200 bg-rose-50/20 rounded-md text-left text-xs text-rose-700 max-h-32 overflow-y-auto">
                <span className="font-semibold block mb-1">{summary.errors.length} Warnings/Errors:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {summary.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{typeof err === "string" ? err : err.error || JSON.stringify(err)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
          {step > 1 && step < 4 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button
                size="sm"
                onClick={() => setStep(3)}
                disabled={!isEmailMapped}
              >
                Continue to Strategy <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}

            {step === 3 && (
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Ingesting Leads...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" /> Start Ingestion
                  </>
                )}
              </Button>
            )}

            {step === 4 && (
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done & View Leads
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
