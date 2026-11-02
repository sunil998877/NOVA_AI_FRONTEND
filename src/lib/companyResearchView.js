export function companyResearchView(research) {
  if (!research || typeof research !== "object") return null;
  const dummy = /no verified public source was found/i.test(String(research.summary || ""));
  const ungrounded = dummy
    || research.qualityStatus === "NEEDS_REVIEW"
    || research.source === "openai_company_lookup"
    || research.source === "openai_key_missing";
  const inference = research.unverifiedHypothesis?.summary || "";
  return {
    ungrounded,
    domain: research.domain || "",
    summary: dummy ? "" : String(research.summary || "").trim(),
    inference: String(inference).trim(),
    coreServices: ungrounded ? "" : research.coreServices,
    targetAudience: ungrounded ? "" : research.targetAudience,
    growthOpportunity: ungrounded ? "" : research.growthOpportunity,
    sources: Array.isArray(research.sources) ? research.sources : [],
    qualityStatus: research.qualityStatus || "",
    source: research.source || "",
  };
}
