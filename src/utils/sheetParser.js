export const loadSheetJs = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const existing = document.querySelector('script[data-sheetjs="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.XLSX));
      existing.addEventListener("error", () => reject(new Error("Failed to load Excel library")));
      return;
    }
    const script = document.createElement("script");
    script.dataset.sheetjs = "true";
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error("Could not load Excel parser (network error). Please use CSV format or ensure internet connectivity."));
    document.head.appendChild(script);
  });
};

export function parseCsvText(input) {
  const text = String(input || "").replace(/^\uFEFF/, "");
  const firstLine = text.split(/[\r\n]+/)[0] || "";
  const counts = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
    "|": (firstLine.match(/\|/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const delimiter = best && best[1] > 0 ? best[0] : ",";

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ""));
}

export async function parseFileToLeads(file) {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

  if (isExcel) {
    const XLSX = await loadSheetJs();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("The Excel workbook contains no sheets");
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const csvText = XLSX.utils.sheet_to_csv(worksheet);
    const parsedRows = parseCsvText(csvText);
    if (parsedRows.length === 0) {
      throw new Error("The selected Excel sheet contains no data");
    }
    const headers = parsedRows[0].map((h) => String(h).trim().replace(/^["']|["']$/g, ""));
    const dataRows = parsedRows.slice(1);
    return {
      headers,
      rows: dataRows,
      csvText,
      totalRows: dataRows.length,
      sheetName: firstSheetName,
    };
  } else {
    const text = await file.text();
    const parsedRows = parseCsvText(text);
    if (parsedRows.length === 0) {
      throw new Error("The selected CSV file contains no data");
    }
    const headers = parsedRows[0].map((h) => String(h).trim().replace(/^["']|["']$/g, ""));
    const dataRows = parsedRows.slice(1);
    return {
      headers,
      rows: dataRows,
      csvText: text,
      totalRows: dataRows.length,
      sheetName: null,
    };
  }
}

export const SCHEMA_TARGET_FIELDS = [
  { key: "email", label: "Email Address", required: true, icon: "Mail" },
  { key: "name", label: "Full Name", required: false, icon: "User" },
  { key: "firstName", label: "First Name", required: false, icon: "User" },
  { key: "lastName", label: "Last Name", required: false, icon: "User" },
  { key: "company", label: "Company / Organization", required: false, icon: "Building" },
  { key: "phone", label: "Phone Number", required: false, icon: "Phone" },
  { key: "country", label: "Phone Country", required: false, icon: "Globe" },
  { key: "whatsapp_number", label: "WhatsApp Number", required: false, icon: "MessageCircle" },
  { key: "priority", label: "Priority Score (1-100)", required: false, icon: "Activity" },
  { key: "tags", label: "Tags / Labels", required: false, icon: "Tag" },
  { key: "industry", label: "Industry / Sector", required: false, icon: "Layers" },
];

export function autoDetectMapping(headers) {
  const mapping = {};
  headers.forEach((h) => {
    const lower = h.toLowerCase().trim();
    if (lower.includes("email") || lower === "e-mail" || lower === "mail") {
      mapping[h] = "email";
    } else if (lower.includes("first") && (lower.includes("name") || lower.includes("given"))) {
      mapping[h] = "firstName";
    } else if (lower.includes("last") && (lower.includes("name") || lower.includes("surname") || lower.includes("family"))) {
      mapping[h] = "lastName";
    } else if (lower === "name" || lower === "full name" || lower === "fullname" || lower === "contact name") {
      mapping[h] = "name";
    } else if (lower.includes("whatsapp") || lower === "wa") {
      mapping[h] = "whatsapp_number";
    } else if ((lower.includes("country") || lower === "nation" || lower === "region") && !lower.includes("email")) {
      mapping[h] = "country";
    } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tel") || lower.includes("cell")) {
      mapping[h] = "phone";
    } else if (lower.includes("company") || lower.includes("org") || lower.includes("account") || lower.includes("business")) {
      mapping[h] = "company";
    } else if (lower.includes("priority") || lower.includes("score") || lower.includes("rating")) {
      mapping[h] = "priority";
    } else if (lower.includes("tag") || lower.includes("label") || lower.includes("segment")) {
      mapping[h] = "tags";
    } else if (lower.includes("industry") || lower.includes("sector") || lower.includes("vertical")) {
      mapping[h] = "industry";
    } else {
      mapping[h] = "ignore";
    }
  });
  return mapping;
}
