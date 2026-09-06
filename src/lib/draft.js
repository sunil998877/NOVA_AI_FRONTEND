export function parseDraft(content) {
  if (!content) return { subject: "", body: "" };
  const text = content.trim();
  const subjectMatch = text.match(
    /^\s*(?:\*\*)?Subject\s*:?\s*\*?\*?\*?\s*([^\n*]+)\*?\*?\*?\s*\n?/i
  );
  if (subjectMatch) {
    const subject = subjectMatch[1].trim();
    const body = text.slice(subjectMatch[0].length).trim();
    return { subject, body };
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1 && lines[0].length <= 80) {
    return { subject: lines[0], body: lines.slice(1).join("\n\n") };
  }
  return { subject: "", body: text };
}