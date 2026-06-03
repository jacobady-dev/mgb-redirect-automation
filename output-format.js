// Workbook output formatting layer.
// Keeps the workbook columns aligned with the MGB reference examples.

const processRowsFromBaseApp = originalProcessRowsForRules;

function normalizedSourceKey(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let path = parsed.pathname || "/";
    path = path.replace(/\/+/g, "/");
    if (path.length > 1) path = path.replace(/\/+$/, "");

    const params = [];
    parsed.searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith("utm_")) return;
      if (["_ga", "_gl", "gclid", "fbclid", "msclkid", "mc_cid", "mc_eid"].includes(lowerKey)) return;
      params.push([lowerKey, String(value || "").trim()]);
    });
    params.sort((a, b) => `${a[0]}=${a[1]}`.localeCompare(`${b[0]}=${b[1]}`));
    const query = params.length ? `?${params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}` : "";
    return `${host}${path.toLowerCase()}${query}`;
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  }
}

function outputDestinationSpecificity(row) {
  const destination = String(row["Destination URL"] || "").toLowerCase().replace(/\/+$/, "");
  const approval = String(row["DW - Approval"] || "").toUpperCase();
  let score = 0;
  if (approval.includes("HUMAN")) score += 100;
  if (destination.includes("doctors.massgeneralbrigham.org")) score += 12;
  if (destination.includes("/locations/mass-general-brigham-imaging-")) score += 12;
  if (destination.includes("/newton-wellesley-childbirth-education")) score += 12;
  if (destination.includes("/billing/cms-required-hospital-charge-data")) score += 12;
  if (destination.includes("/notices/hipaa") || destination.includes("/notices/web-privacy-policy")) score += 12;
  if (destination.includes("/patient-rights")) score += 12;
  if (destination.includes("/education-and-training") || destination.includes("/medical-professionals")) score += 10;
  if (destination.includes("/cancer/lung-cancer-screening") || destination.includes("/cancer/colorectal-cancer-screening")) score += 12;
  if (destination.includes("/about/giving")) score += 10;
  if (destination.endsWith("/patient-care/services-and-specialties")) score -= 20;
  if (destination.endsWith("/patient-care/patient-visitor-information")) score -= 15;
  if (destination.endsWith("/planning-your-visit/visitor-policy")) score -= 8;
  return score;
}

function chooseOutputRow(existing, candidate) {
  if (!existing) return candidate;
  const existingScore = outputDestinationSpecificity(existing);
  const candidateScore = outputDestinationSpecificity(candidate);
  if (candidateScore > existingScore) return candidate;
  if (candidateScore < existingScore) return existing;

  const existingUrl = String(existing["Existing URL"] || "");
  const candidateUrl = String(candidate["Existing URL"] || "");
  const candidateIsHttps = candidateUrl.startsWith("https://") && !existingUrl.startsWith("https://");
  if (candidateIsHttps) return candidate;
  const candidateHasWww = candidateUrl.includes("//www.") && !existingUrl.includes("//www.");
  if (candidateHasWww) return candidate;
  return existing;
}

function dedupeOutputRows(rows) {
  const keyed = new Map();
  (rows || []).forEach((row) => {
    const key = normalizedSourceKey(row["Existing URL"]);
    if (!key) return;
    keyed.set(key, chooseOutputRow(keyed.get(key), row));
  });
  return Array.from(keyed.values());
}

processRows = function formattedProcessRows(inputs) {
  const result = processRowsFromBaseApp({
    ...inputs,
    manualRows: normalizeManualRows(inputs.manualRows || []),
  });

  result.redirectRows = (result.redirectRows || []).map((row) => ({
    "Existing URL": row["Existing URL"] || row["Source URL"] || "",
    "Destination URL": row["Destination URL"] || "",
    "DW - Approval": row["DW - Approval"] || "",
    "829 Notes": row["829 Notes"] || row["Notes"] || row["Rule"] || "",
  })).filter((row) => row["Existing URL"]);

  result.manualExcludeRows = (result.manualExcludeRows || []).map((row) => ({
    "Existing URL": row["Existing URL"] || row["Current URL"] || row["Source URL"] || row["Address"] || "",
    "Destination URL": row["Destination URL"] || row["Final URL"] || row["Mapped URL"] || row["Target URL"] || "",
    "DW - Approval": row["DW - Approval"] || row["Approval"] || row["Approved"] || "",
    "829 Notes": row["829 Notes"] || row["SEO Notes"] || row["Notes"] || row["Recommended Action"] || "",
  })).filter((row) => row["Existing URL"]);

  result.humanRows = (result.humanRows || []).map((row) => ({
    "Existing URL": row["Existing URL"] || row["Source URL"] || "",
    "Destination URL": row["Destination URL"] || row["Suggested Destination"] || "",
    "DW - Approval": row["DW - Approval"] || "HUMAN CHECK",
    "829 Notes": row["829 Notes"] || row["Notes"] || row["Review Reason"] || "",
    "Content Type": row["Content Type"] || "",
    "Status Code": row["Status Code"] || "",
    "Title 1": row["Title 1"] || row["Title"] || "",
  })).filter((row) => row["Existing URL"]);

  const redirectBeforeDedupe = result.redirectRows.length;
  const humanBeforeDedupe = result.humanRows.length;
  result.redirectRows = dedupeOutputRows(result.redirectRows);
  result.humanRows = dedupeOutputRows(result.humanRows);

  result.qa.redirectRows = result.redirectRows.length;
  result.qa.manualRows = result.manualExcludeRows.length;
  result.qa.humanRows = result.humanRows.length;
  result.qa.redirectRowsDeduped = redirectBeforeDedupe - result.redirectRows.length;
  result.qa.humanRowsDeduped = humanBeforeDedupe - result.humanRows.length;
  return result;
};

function renderPreview(result) {
  const rows = result.redirectRows.slice(0, 12);
  if (!rows.length) {
    previewEl.innerHTML = "<p class=\"muted\">No redirect rows generated. Check HUMAN CHECK output in the workbook.</p>";
    return;
  }
  const headers = ["Existing URL", "Destination URL", "829 Notes"];
  previewEl.innerHTML = `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}