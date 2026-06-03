// Workbook output formatting layer.
// Keeps the workbook columns aligned with the MGB reference examples.

const processRowsFromBaseApp = originalProcessRowsForRules;

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

  result.qa.redirectRows = result.redirectRows.length;
  result.qa.manualRows = result.manualExcludeRows.length;
  result.qa.humanRows = result.humanRows.length;
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
