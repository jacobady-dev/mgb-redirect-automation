const state = {
  workbookBlob: null,
  csvBlob: null,
  lastResult: null,
};

const ASSET_EXTENSIONS = {
  jsCss: [".js", ".css", ".map"],
  images: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico", ".bmp", ".tif", ".tiff"],
  docs: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".xlsm", ".csv", ".tsv", ".txt", ".zip", ".xml", ".json", ".ppt", ".pptx", ".rtf"],
  videos: [".mp4", ".mov", ".wmv", ".avi", ".webm", ".m4v", ".mpeg", ".mpg"],
};

const STOP_WORDS = new Set([
  "www", "http", "https", "html", "htm", "aspx", "php", "asp", "en", "org", "com", "net",
  "mass", "general", "brigham", "mgb", "newton", "wellesley", "hospital", "hospitals",
  "page", "pages", "home", "main", "about", "and", "the", "for", "with", "our", "your", "you",
  "care", "center", "centers", "services", "service", "medical", "medicine", "department", "departments",
]);

const NEWS_HUMAN_CHECK_NOTE = "Appear to be press release type content or articles specific to what the entity achieved / was doing. IA didn’t show final URL category-level pages for either the Newsroom or H&W articles: https://www.massgeneralbrigham.org/en/health-wellness/ or https://www.massgeneralbrigham.org/en/newsroom/. Flagged as HUMAN CHECK.";

const logEl = document.getElementById("log");
const summaryEl = document.getElementById("summary");
const previewEl = document.getElementById("preview");
const downloadWorkbookBtn = document.getElementById("downloadWorkbook");
const downloadCsvBtn = document.getElementById("downloadCsv");

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await generateWorkbook();
});

downloadWorkbookBtn.addEventListener("click", () => {
  if (state.workbookBlob) downloadBlob(state.workbookBlob, buildFilename("Redirect_Mapping_Workbook", "xlsx"));
});

downloadCsvBtn.addEventListener("click", () => {
  if (state.csvBlob) downloadBlob(state.csvBlob, buildFilename("Redirect_List_for_CSV", "csv"));
});

function log(message) {
  logEl.textContent += `\n> ${message}`;
  logEl.scrollTop = logEl.scrollHeight;
}

function resetLog() {
  logEl.textContent = "> Initializing redirect mapper...";
}

async function generateWorkbook() {
  resetLog();
  setButtons(false);
  summaryEl.innerHTML = "";
  previewEl.innerHTML = "";

  const sourceFile = document.getElementById("sourceCrawl").files[0];
  const manualFile = document.getElementById("manualFile").files[0];
  const destinationFile = document.getElementById("destinationCrawl").files[0];
  const iaFile = document.getElementById("iaFile").files[0];

  if (!sourceFile || !manualFile || !destinationFile) {
    log("Missing required uploads. Source crawl, manual exclude/key, and MGB destination crawl are required.");
    return;
  }

  try {
    log(`Reading source crawl: ${sourceFile.name}`);
    const sourceRows = await readAnyTable(sourceFile);
    log(`Reading manual exclude/key: ${manualFile.name}`);
    const manualRows = await readAnyTable(manualFile);
    log(`Reading MGB destination crawl: ${destinationFile.name}`);
    const destinationRows = await readAnyTable(destinationFile);
    let iaRows = [];
    if (iaFile) {
      log(`Reading IA doc: ${iaFile.name}`);
      iaRows = await readAnyTable(iaFile);
    } else {
      log("No IA doc uploaded. Destination crawl matching will carry the run.");
    }

    log(`Loaded ${sourceRows.length.toLocaleString()} source rows.`);
    log(`Loaded ${manualRows.length.toLocaleString()} manual rows.`);
    log(`Loaded ${destinationRows.length.toLocaleString()} MGB destination crawl rows.`);
    if (iaRows.length) log(`Loaded ${iaRows.length.toLocaleString()} IA rows.`);

    const result = processRows({ sourceRows, manualRows, destinationRows, iaRows });
    state.lastResult = result;
    log("Workbook tabs assembled.");
    log(`Manual exclude overlap removed from CSV: ${result.qa.manualOverlapInCsv}.`);
    log(`Redirect rows: ${result.redirectRows.length.toLocaleString()}. HUMAN CHECK rows: ${result.humanRows.length.toLocaleString()}.`);

    const workbook = buildXlsxWorkbook(result);
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    state.workbookBlob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const csvText = toCsv(result.redirectRows);
    state.csvBlob = new Blob([csvText], { type: "text/csv;charset=utf-8" });

    renderSummary(result);
    renderPreview(result);
    setButtons(true);
    log("Ready. Download the workbook or CSV-only export.");
  } catch (error) {
    console.error(error);
    log(`Run failed: ${error.message}`);
    setButtons(false);
  }
}

function setButtons(enabled) {
  downloadWorkbookBtn.disabled = !enabled;
  downloadCsvBtn.disabled = !enabled;
}

async function readAnyTable(file) {
  const ext = getExtension(file.name);
  if ([".xlsx", ".xlsm", ".xls"].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
    const rows = [];
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      sheetRows.forEach((row) => rows.push({ ...row, "__Sheet Name": sheetName }));
    });
    return rows;
  }

  const text = await file.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => String(header || "").trim(),
  });

  if (parsed.errors && parsed.errors.length) {
    const fallback = Papa.parse(text, {
      header: true,
      skipEmptyLines: "greedy",
      delimiter: "\t",
      transformHeader: (header) => String(header || "").trim(),
    });
    return fallback.data.map(cleanRow);
  }
  return parsed.data.map(cleanRow);
}

function cleanRow(row) {
  const cleaned = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) return;
    cleaned[cleanKey] = value == null ? "" : String(value).trim();
  });
  return cleaned;
}

function processRows({ sourceRows, manualRows, destinationRows, iaRows }) {
  const siteLabel = document.getElementById("siteLabel").value || "Redirect Mapping";
  const sourceDomain = document.getElementById("sourceDomain").value || "";
  const destinationDomain = document.getElementById("destinationDomain").value || "https://www.massgeneralbrigham.org";
  const generatedAt = new Date().toISOString();

  const manualUrlSet = new Set();
  manualRows.forEach((row) => {
    const url = detectUrl(row, ["Current URL", "Address", "URL", "Source URL", "Legacy URL"]);
    if (url) manualUrlSet.add(normalizeUrl(url));
  });

  const destinationCandidates = buildDestinationCandidates(destinationRows, iaRows, destinationDomain);
  const fullSiteCrawl = sourceRows.map((row) => normalizeSourceRow(row));
  const redirectRows = [];
  const humanRows = [];
  const workingFiltered = [];
  const jsCssRows = [];
  const imageRows = [];
  const docRows = [];
  const videoRows = [];
  const excludedRows = [];
  let manualMatchesFoundInSource = 0;

  fullSiteCrawl.forEach((row) => {
    if (!row.sourceUrl) return;
    const normalized = normalizeUrl(row.sourceUrl);
    if (manualUrlSet.has(normalized)) {
      manualMatchesFoundInSource += 1;
      return;
    }

    const assetType = classifyAsset(row.sourceUrl, row.contentType);
    if (assetType === "jsCss") return jsCssRows.push(assetOutput(row, "JS/CSS asset excluded from redirect CSV."));
    if (assetType === "images") return imageRows.push(assetOutput(row, "Image asset excluded from redirect CSV."));
    if (assetType === "docs") return docRows.push(assetOutput(row, "Document/file/XML asset excluded from redirect CSV."));
    if (assetType === "videos") return videoRows.push(assetOutput(row, "Video asset excluded from redirect CSV."));
    if (!isLikelyHtml(row.sourceUrl, row.contentType)) return excludedRows.push(assetOutput(row, "Non-HTML row excluded from redirect CSV."));

    workingFiltered.push(row);
    const decision = decideMapping(row, destinationCandidates);
    if (decision.bucket === "redirect") {
      redirectRows.push({
        "Source URL": row.sourceUrl,
        "Destination URL": decision.destinationUrl,
        "Redirect Type": "301",
        "Rule": decision.rule,
        "Confidence": percent(decision.score),
        "Status Code": row.statusCode,
        "Content Type": row.contentType,
        "Title": row.title,
        "H1": row.h1,
        "Notes": decision.notes,
      });
    } else {
      humanRows.push({
        "Source URL": row.sourceUrl,
        "Suggested Destination": decision.destinationUrl || "",
        "Review Reason": decision.rule,
        "Confidence": percent(decision.score || 0),
        "Status Code": row.statusCode,
        "Content Type": row.contentType,
        "Title": row.title,
        "H1": row.h1,
        "Notes": decision.notes,
      });
    }
  });

  const csvUrlSet = new Set(redirectRows.map((row) => normalizeUrl(row["Source URL"])));
  let manualOverlapInCsv = 0;
  manualUrlSet.forEach((url) => {
    if (csvUrlSet.has(url)) manualOverlapInCsv += 1;
  });

  const qa = {
    siteLabel,
    sourceDomain,
    destinationDomain,
    generatedAt,
    sourceRows: sourceRows.length,
    manualRows: manualRows.length,
    manualUniqueUrls: manualUrlSet.size,
    manualMatchesFoundInSource,
    destinationCandidates: destinationCandidates.length,
    workingFiltered: workingFiltered.length,
    redirectRows: redirectRows.length,
    humanRows: humanRows.length,
    jsCssRows: jsCssRows.length,
    imageRows: imageRows.length,
    docRows: docRows.length,
    videoRows: videoRows.length,
    excludedRows: excludedRows.length,
    manualOverlapInCsv,
  };

  return {
    qa,
    logicRows: buildLogicRows(qa),
    redirectRows,
    manualExcludeRows: manualRows,
    humanRows,
    jsCssRows,
    imageRows,
    docRows,
    videoRows,
    excludedRows,
    workingFiltered,
    fullSiteCrawl,
    destinationCandidates,
    originalManualExportRows: manualRows,
  };
}

function normalizeSourceRow(row) {
  return {
    "Source URL": detectUrl(row, ["Address", "Current URL", "URL", "Source URL", "Legacy URL"]),
    "Content Type": valueFor(row, ["Content Type", "Content-Type", "MIME Type"]),
    "Status Code": valueFor(row, ["Status Code", "Status"]),
    "Status": valueFor(row, ["Status", "Status Text"]),
    "Indexability": valueFor(row, ["Indexability"]),
    "Indexability Status": valueFor(row, ["Indexability Status"]),
    "Title": valueFor(row, ["Title 1", "Title", "Page Title"]),
    "Meta Description": valueFor(row, ["Meta Description 1", "Meta Description", "Description"]),
    "H1": valueFor(row, ["H1-1", "H1", "Heading 1"]),
    "H2": valueFor(row, ["H2-1", "H2", "Heading 2"]),
    "Canonical URL": valueFor(row, ["Canonical Link Element 1", "Canonical", "Canonical URL"]),
    "Redirect URL": valueFor(row, ["Redirect URL", "Final URL"]),
    "Crawl Timestamp": valueFor(row, ["Crawl Timestamp"]),
    sourceUrl: detectUrl(row, ["Address", "Current URL", "URL", "Source URL", "Legacy URL"]),
    contentType: valueFor(row, ["Content Type", "Content-Type", "MIME Type"]),
    statusCode: valueFor(row, ["Status Code", "Status"]),
    title: valueFor(row, ["Title 1", "Title", "Page Title"]),
    metaDescription: valueFor(row, ["Meta Description 1", "Meta Description", "Description"]),
    h1: valueFor(row, ["H1-1", "H1", "Heading 1"]),
    h2: valueFor(row, ["H2-1", "H2", "Heading 2"]),
    redirectUrl: valueFor(row, ["Redirect URL", "Final URL"]),
    raw: row,
  };
}

function buildDestinationCandidates(destinationRows, iaRows, destinationDomain) {
  const candidates = [];
  const seen = new Set();

  function addCandidate(row, sourceLabel) {
    const url = detectUrl(row, ["Address", "Final URL", "URL", "Destination URL", "MGB URL", "Canonical Link Element 1"]);
    if (!url) return;
    if (!url.includes("massgeneralbrigham.org") && !url.startsWith("/en/")) return;
    const absoluteUrl = url.startsWith("/") ? destinationDomain.replace(/\/$/, "") + url : url;
    const normalized = normalizeUrl(absoluteUrl);
    if (seen.has(normalized)) return;

    const contentType = valueFor(row, ["Content Type", "Content-Type", "MIME Type"]);
    const statusCode = valueFor(row, ["Status Code", "Status"]);
    if (classifyAsset(absoluteUrl, contentType)) return;
    if (contentType && !isLikelyHtml(absoluteUrl, contentType)) return;
    if (statusCode && !String(statusCode).startsWith("2")) return;

    seen.add(normalized);
    const title = valueFor(row, ["Title 1", "Title", "Page Title"]);
    const h1 = valueFor(row, ["H1-1", "H1", "Heading 1"]);
    const meta = valueFor(row, ["Meta Description 1", "Meta Description", "Description"]);
    const pathText = pathFromUrl(absoluteUrl).replace(/[/-]/g, " ");
    candidates.push({
      "Destination URL": absoluteUrl,
      "Source": sourceLabel,
      "Status Code": statusCode,
      "Content Type": contentType,
      "Title": title,
      "H1": h1,
      "Meta Description": meta,
      "Canonical URL": valueFor(row, ["Canonical Link Element 1", "Canonical", "Canonical URL"]),
      destinationUrl: absoluteUrl,
      text: `${absoluteUrl} ${title} ${h1} ${meta} ${pathText}`,
      tokens: tokenize(`${absoluteUrl} ${title} ${h1} ${meta} ${pathText}`),
    });
  }

  destinationRows.forEach((row) => addCandidate(row, "MGB Destination Crawl"));
  iaRows.forEach((row) => addCandidate(row, "MGB IA Doc"));

  return candidates;
}

function decideMapping(row, destinationCandidates) {
  const sourceUrl = row.sourceUrl;
  const redirectUrl = row.redirectUrl || "";
  if (redirectUrl.includes("massgeneralbrigham.org") && isValidUrl(redirectUrl)) {
    return { bucket: "redirect", destinationUrl: redirectUrl, rule: "Existing MGB redirect URL found in crawl", score: 1, notes: "Source crawl already included an MGB redirect destination." };
  }

  if (isProviderDetail(sourceUrl)) {
    const providerLanding = bestCandidateForTerms(destinationCandidates, ["provider", "providers", "doctor", "find care"]);
    return { bucket: "human", destinationUrl: providerLanding?.destinationUrl || "https://www.massgeneralbrigham.org/en/providers", rule: "Provider detail page requires HUMAN CHECK", score: providerLanding?.score || 0.2, notes: "Provider detail pages should not be force-mapped unless a confirmed destination provider URL exists." };
  }

  if (isProviderDirectory(sourceUrl)) {
    const providerLanding = bestCandidateForTerms(destinationCandidates, ["providers", "doctor", "find care"]);
    return { bucket: "redirect", destinationUrl: providerLanding?.destinationUrl || "https://www.massgeneralbrigham.org/en/providers", rule: "Provider directory mapped to provider search/directory", score: providerLanding?.score || 0.55, notes: "Provider directory pages may map to the MGB provider directory when appropriate." };
  }

  const best = findBestCandidate(row, destinationCandidates);

  if (isNewsOrArticle(sourceUrl, row.title, row.h1)) {
    if (best && best.score >= 0.82 && best.destinationUrl.includes("/newsroom/")) {
      return { bucket: "redirect", destinationUrl: best.destinationUrl, rule: "Strong newsroom article match", score: best.score, notes: "Mapped only because a strong specific MGB Newsroom destination was found." };
    }
    return { bucket: "human", destinationUrl: best?.destinationUrl || "", rule: "News / article / press release requires HUMAN CHECK", score: best?.score || 0, notes: NEWS_HUMAN_CHECK_NOTE };
  }

  if (isLocationPage(sourceUrl, row.title, row.h1)) {
    if (best && best.score >= 0.74 && destinationLooksLikeLocation(best.destinationUrl, best.text)) {
      return { bucket: "redirect", destinationUrl: best.destinationUrl, rule: "Strong location destination match", score: best.score, notes: "Location page mapped because a strong MGB location candidate was found." };
    }
    return { bucket: "human", destinationUrl: best?.destinationUrl || "", rule: "Location page requires HUMAN CHECK", score: best?.score || 0, notes: "Location pages should not be force-mapped unless a matching MGB location page exists." };
  }

  if (best && best.score >= 0.58) {
    return { bucket: "redirect", destinationUrl: best.destinationUrl, rule: "Destination crawl fuzzy match", score: best.score, notes: best.reason };
  }

  const categoryCandidate = categoryFallback(row, destinationCandidates);
  if (categoryCandidate) {
    return { bucket: "redirect", destinationUrl: categoryCandidate.destinationUrl, rule: categoryCandidate.rule, score: categoryCandidate.score, notes: "Category fallback used because a page-level match was not strong enough." };
  }

  return { bucket: "human", destinationUrl: best?.destinationUrl || "", rule: "No confident destination match", score: best?.score || 0, notes: "No confident IA or destination crawl match. Review manually." };
}

function findBestCandidate(row, destinationCandidates) {
  const sourceText = `${row.sourceUrl} ${row.title} ${row.h1} ${row.metaDescription} ${row.h2}`;
  const sourceTokens = tokenize(sourceText);
  let best = null;

  destinationCandidates.forEach((candidate) => {
    const score = scoreTokens(sourceTokens, candidate.tokens, row.sourceUrl, candidate.destinationUrl);
    if (!best || score > best.score) {
      best = { ...candidate, score, reason: `Best match from ${candidate.Source}; token/path similarity ${percent(score)}.` };
    }
  });
  return best;
}

function categoryFallback(row, destinationCandidates) {
  const text = `${row.sourceUrl} ${row.title} ${row.h1}`.toLowerCase();
  const rules = [
    { terms: ["billing", "insurance", "financial assistance"], destTerms: ["billing", "patient visitor information"], rule: "Billing category fallback" },
    { terms: ["medical records", "records"], destTerms: ["medical records", "patient visitor information"], rule: "Medical records category fallback" },
    { terms: ["careers", "job", "employment", "benefits"], destTerms: ["careers"], rule: "Careers category fallback" },
    { terms: ["patient gateway"], destTerms: ["patient gateway"], rule: "Patient Gateway category fallback" },
    { terms: ["primary care"], destTerms: ["primary care"], rule: "Primary Care category fallback" },
    { terms: ["emergency"], destTerms: ["emergency"], rule: "Emergency category fallback" },
    { terms: ["orthopedic", "orthopedics"], destTerms: ["orthopedics"], rule: "Orthopedics category fallback" },
    { terms: ["radiology", "imaging", "mri", "ct scan", "ultrasound"], destTerms: ["radiology", "imaging"], rule: "Radiology and imaging category fallback" },
    { terms: ["cancer", "oncology"], destTerms: ["cancer"], rule: "Cancer category fallback" },
    { terms: ["maternity", "obstetrics", "gynecology", "ob gyn", "obgyn"], destTerms: ["obstetrics", "gynecology"], rule: "OB/GYN category fallback" },
    { terms: ["rehabilitation", "physical therapy", "occupational therapy"], destTerms: ["rehabilitation"], rule: "Rehabilitation category fallback" },
  ];

  for (const rule of rules) {
    if (rule.terms.some((term) => text.includes(term))) {
      const candidate = bestCandidateForTerms(destinationCandidates, rule.destTerms);
      if (candidate) return { ...candidate, score: Math.max(candidate.score, 0.55), rule: rule.rule };
    }
  }
  return null;
}

function bestCandidateForTerms(destinationCandidates, terms) {
  let best = null;
  destinationCandidates.forEach((candidate) => {
    const text = candidate.text.toLowerCase();
    let score = 0;
    terms.forEach((term) => {
      if (text.includes(term.toLowerCase())) score += 1;
    });
    if (candidate.destinationUrl.includes("/en/patient-care/services-and-specialties")) score += 0.25;
    if (candidate.destinationUrl.includes("/en/patient-care/patient-visitor-information")) score += 0.2;
    if (candidate.destinationUrl.includes("/en/about")) score += 0.1;
    if (score > 0 && (!best || score > best.score)) {
      best = { destinationUrl: candidate.destinationUrl, score: Math.min(score / Math.max(terms.length, 1), 0.9) };
    }
  });
  return best;
}

function scoreTokens(sourceTokens, destTokens, sourceUrl, destUrl) {
  if (!sourceTokens.size || !destTokens.size) return 0;
  let overlap = 0;
  sourceTokens.forEach((token) => { if (destTokens.has(token)) overlap += 1; });
  let score = overlap / Math.sqrt(sourceTokens.size * destTokens.size);

  const sourcePathTokens = tokenize(pathFromUrl(sourceUrl));
  const destPathTokens = tokenize(pathFromUrl(destUrl));
  let pathOverlap = 0;
  sourcePathTokens.forEach((token) => { if (destPathTokens.has(token)) pathOverlap += 1; });
  if (pathOverlap) score += Math.min(0.2, pathOverlap * 0.04);

  return Math.min(score, 1);
}

function tokenize(text) {
  const tokens = new Set();
  String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .forEach((token) => {
      if (token.length < 3) return;
      if (STOP_WORDS.has(token)) return;
      tokens.add(stemToken(token));
    });
  return tokens;
}

function stemToken(token) {
  return token.replace(/ies$/, "y").replace(/ing$/, "").replace(/ers$/, "er").replace(/s$/, "");
}

function classifyAsset(url, contentType) {
  const lowerType = String(contentType || "").toLowerCase();
  const ext = extensionFromUrl(url);
  if (ASSET_EXTENSIONS.jsCss.includes(ext) || lowerType.includes("javascript") || lowerType.includes("text/css")) return "jsCss";
  if (ASSET_EXTENSIONS.images.includes(ext) || lowerType.startsWith("image/")) return "images";
  if (ASSET_EXTENSIONS.videos.includes(ext) || lowerType.startsWith("video/")) return "videos";
  if (ASSET_EXTENSIONS.docs.includes(ext) || lowerType.includes("application/pdf") || lowerType.includes("application/xml") || lowerType.includes("text/xml")) return "docs";
  return null;
}

function isLikelyHtml(url, contentType) {
  const lowerType = String(contentType || "").toLowerCase();
  if (!lowerType) return !classifyAsset(url, contentType);
  return lowerType.includes("text/html") || lowerType.includes("charset=utf-8") || lowerType.includes("charset=utf");
}

function isProviderDetail(url) {
  const path = pathFromUrl(url).toLowerCase();
  return path.includes("/find-a-doctor/find-a-doctor-profile/") || path.includes("/provider/");
}

function isProviderDirectory(url) {
  const path = pathFromUrl(url).toLowerCase();
  return path.includes("find-a-doctor") || path.includes("all-providers") || path.endsWith("/providers");
}

function isLocationPage(url, title, h1) {
  const text = `${url} ${title} ${h1}`.toLowerCase();
  return text.includes("/locations/") || text.includes("directions") || text.includes("parking") || text.includes("map");
}

function destinationLooksLikeLocation(url, text) {
  const combined = `${url} ${text}`.toLowerCase();
  return combined.includes("/locations") || combined.includes("find locations") || combined.includes("location");
}

function isNewsOrArticle(url, title, h1) {
  const text = `${url} ${title} ${h1}`.toLowerCase();
  return text.includes("/news") || text.includes("news-article") || text.includes("press release") || text.includes("press-release") || text.includes("article") || text.includes("community update");
}

function assetOutput(row, notes) {
  return { "Source URL": row.sourceUrl, "Status Code": row.statusCode, "Status": row["Status"] || "", "Content Type": row.contentType, "Title": row.title, "Notes": notes };
}

function buildLogicRows(qa) {
  return [
    { "Item": "Generated At", "Value": qa.generatedAt },
    { "Item": "Site Label", "Value": qa.siteLabel },
    { "Item": "Source Domain", "Value": qa.sourceDomain },
    { "Item": "Destination Domain", "Value": qa.destinationDomain },
    { "Item": "Priority 1", "Value": "Manual exclude/key rows are removed before automated processing." },
    { "Item": "Priority 2", "Value": "IA/destination crawl matching is used for confident destination candidates." },
    { "Item": "Priority 3", "Value": "Provider detail pages, uncertain location pages, and weak news/article matches go to HUMAN CHECK." },
    { "Item": "Manual Unique URLs", "Value": qa.manualUniqueUrls },
    { "Item": "Manual URLs Found in Source Crawl", "Value": qa.manualMatchesFoundInSource },
    { "Item": "Manual Exclude URLs Duplicated in CSV", "Value": qa.manualOverlapInCsv },
    { "Item": "Redirect Rows", "Value": qa.redirectRows },
    { "Item": "HUMAN CHECK Rows", "Value": qa.humanRows },
    { "Item": "Working Filtered Crawl Rows", "Value": qa.workingFiltered },
    { "Item": "MGB Destination Candidates", "Value": qa.destinationCandidates },
  ];
}

function buildXlsxWorkbook(result) {
  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Redirect Logic", result.logicRows);
  appendSheet(wb, "Redirect List for CSV", result.redirectRows);
  appendSheet(wb, "Manually Mapped URLs (exclude)", result.manualExcludeRows);
  appendSheet(wb, "HUMAN CHECK", result.humanRows);
  appendSheet(wb, "JS + CSS Pages", result.jsCssRows);
  appendSheet(wb, "Images", result.imageRows);
  appendSheet(wb, "PDFs Files Zip XML", result.docRows);
  appendSheet(wb, "Videos", result.videoRows);
  appendSheet(wb, "Excluded Non-HTML", result.excludedRows);
  appendSheet(wb, "Working Filtered Crawl", result.workingFiltered.map(stripInternalRow));
  appendSheet(wb, "Full Site Crawl", result.fullSiteCrawl.map(stripInternalRow));
  appendSheet(wb, "MGB Destination Candidates", result.destinationCandidates.map(stripCandidateInternal));
  appendSheet(wb, "Original Manual Export", result.originalManualExportRows);
  return wb;
}

function appendSheet(workbook, sheetName, rows) {
  const safeRows = rows && rows.length ? rows : [{ "No rows": "" }];
  const worksheet = XLSX.utils.json_to_sheet(safeRows);
  worksheet["!cols"] = inferColumnWidths(safeRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
}

function inferColumnWidths(rows) {
  const headers = Object.keys(rows[0] || {});
  return headers.map((header) => {
    let max = String(header).length;
    rows.slice(0, 100).forEach((row) => { max = Math.max(max, String(row[header] || "").length); });
    return { wch: Math.min(Math.max(max + 2, 12), 48) };
  });
}

function stripInternalRow(row) {
  const clean = { ...row };
  delete clean.sourceUrl; delete clean.contentType; delete clean.statusCode; delete clean.title; delete clean.metaDescription; delete clean.h1; delete clean.h2; delete clean.redirectUrl; delete clean.raw;
  return clean;
}

function stripCandidateInternal(candidate) {
  const clean = { ...candidate };
  delete clean.destinationUrl; delete clean.text; delete clean.tokens;
  return clean;
}

function renderSummary(result) {
  const stats = [
    ["Redirects", result.redirectRows.length],
    ["HUMAN CHECK", result.humanRows.length],
    ["Manual excludes", result.qa.manualUniqueUrls],
    ["Manual overlap in CSV", result.qa.manualOverlapInCsv],
    ["MGB candidates", result.qa.destinationCandidates],
    ["Assets excluded", result.jsCssRows.length + result.imageRows.length + result.docRows.length + result.videoRows.length],
  ];
  summaryEl.innerHTML = stats.map(([label, value]) => `<div class="stat"><strong>${Number(value).toLocaleString()}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function renderPreview(result) {
  const rows = result.redirectRows.slice(0, 12);
  if (!rows.length) {
    previewEl.innerHTML = "<p class=\"muted\">No redirect rows generated. Check HUMAN CHECK output in the workbook.</p>";
    return;
  }
  const headers = ["Source URL", "Destination URL", "Rule", "Confidence"];
  previewEl.innerHTML = `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function toCsv(rows) { return Papa.unparse(rows || []); }

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildFilename(base, extension) {
  const label = (document.getElementById("siteLabel").value || "redirect-mapping").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${label || "redirect-mapping"}_${base}.${extension}`;
}

function detectUrl(row, preferredKeys = []) {
  for (const key of preferredKeys) {
    const value = valueFor(row, [key]);
    if (isLikelyUrl(value)) return String(value).trim();
  }
  for (const [key, value] of Object.entries(row || {})) {
    const keyLower = key.toLowerCase();
    if ((keyLower.includes("url") || keyLower.includes("address")) && isLikelyUrl(value)) return String(value).trim();
  }
  for (const value of Object.values(row || {})) {
    if (isLikelyUrl(value)) return String(value).trim();
  }
  return "";
}

function valueFor(row, keys) {
  if (!row) return "";
  const lowerMap = new Map(Object.keys(row).map((key) => [key.toLowerCase().trim(), key]));
  for (const key of keys) {
    const exact = lowerMap.get(String(key).toLowerCase().trim());
    if (exact && row[exact] != null) return String(row[exact]).trim();
  }
  return "";
}

function isLikelyUrl(value) {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) || /^\/en\//i.test(text);
}

function isValidUrl(value) {
  try { new URL(value); return true; } catch { return false; }
}

function normalizeUrl(url) {
  const text = String(url || "").trim();
  if (!text) return "";
  try {
    const parsed = new URL(text.startsWith("http") ? text : `https://placeholder.local${text}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/$/, "").toLowerCase() || "/";
    const search = parsed.search.toLowerCase();
    return `${host}${path}${search}`;
  } catch {
    return text.toLowerCase().replace(/\/$/, "");
  }
}

function pathFromUrl(url) {
  try { return new URL(url).pathname || "/"; } catch { return String(url || ""); }
}

function extensionFromUrl(url) {
  const clean = String(url || "").split("?")[0].split("#")[0].toLowerCase();
  const match = clean.match(/\.[a-z0-9]{2,6}$/);
  return match ? match[0] : "";
}

function getExtension(filename) {
  const match = String(filename || "").toLowerCase().match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function percent(value) { return `${Math.round((Number(value) || 0) * 100)}%`; }

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}
