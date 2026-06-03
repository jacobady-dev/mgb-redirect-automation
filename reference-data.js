const CORE_MGB_REFERENCE_URLS = [
  ["https://www.massgeneralbrigham.org/en", "Mass General Brigham"],
  ["https://www.massgeneralbrigham.org/en/contact-us", "Contact Us"],
  ["https://www.massgeneralbrigham.org/en/about", "About Us"],
  ["https://www.massgeneralbrigham.org/en/about/careers", "Careers"],
  ["https://www.massgeneralbrigham.org/en/about/newsroom", "Newsroom"],
  ["https://www.massgeneralbrigham.org/en/about/newsroom/articles", "Newsroom Articles"],
  ["https://www.massgeneralbrigham.org/en/about/newsroom/press-releases", "Press Releases"],
  ["https://www.massgeneralbrigham.org/en/providers", "Providers"],
  ["https://www.massgeneralbrigham.org/en/locations", "Locations"],
  ["https://www.massgeneralbrigham.org/en/patient-care", "Patient Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties", "Services and Specialties"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations", "Locations"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information", "Patient and Visitor Information"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing", "Billing"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/medical-records", "Medical Records"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/patient-gateway", "Patient Gateway"],
  ["https://www.massgeneralbrigham.org/en/patient-care/virtual-care", "Virtual Care"],
  ["https://www.massgeneralbrigham.org/en/health-wellness", "Health and Wellness"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/primary-care", "Primary Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/urgent-care", "Urgent Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/emergency", "Emergency Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/orthopedics", "Orthopedics"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/sports-medicine", "Sports Medicine"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/radiology-and-imaging", "Radiology and Imaging"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/rehabilitation", "Rehabilitation"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/cancer", "Cancer"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/heart", "Heart"],
  ["https://www.massgeneralbrigham.org/en/education-and-training", "Education and Training"],
  ["https://www.massgeneralbrigham.org/en/research-and-innovation", "Research and Innovation"],
  ["https://www.massgeneralbrigham.org/en/notices", "Notices"],
];

function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    const lastSegment = path.split("/").filter(Boolean).pop() || parsed.hostname;
    return lastSegment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return String(url || "").replace(/[-_]+/g, " ");
  }
}

function rowsFromUrls(urls, sourceLabel = "Bundled MGB Reference") {
  const seen = new Set();
  return urls
    .map((url) => String(url || "").trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => {
      const normalized = normalizeUrl(url);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .map((url) => {
      const title = titleFromUrl(url);
      return {
        "Address": url,
        "Content Type": "text/html;charset=utf-8",
        "Status Code": "200",
        "Status": "Bundled Reference",
        "Indexability": "Indexable",
        "Title 1": `${title} | Mass General Brigham`,
        "Meta Description 1": `${title} destination reference for Mass General Brigham redirect mapping.`,
        "H1-1": title,
        "H2-1": "",
        "Canonical Link Element 1": url,
        "Reference Source": sourceLabel,
      };
    });
}

function buildDefaultReferenceRows(sourceLabel = "Bundled MGB Reference") {
  return rowsFromUrls(CORE_MGB_REFERENCE_URLS.map(([url]) => url), sourceLabel);
}

async function loadBundledReferenceRows(sourceLabel = "Bundled MGB Reference") {
  const response = await fetch("data/mgb-reference.csv", { cache: "no-store" });
  if (!response.ok) throw new Error(`Bundled reference CSV returned ${response.status}`);

  const csvText = await response.text();
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => String(header || "").trim(),
  });

  const urls = parsed.data
    .map((row) => row.Address || row.URL || row.url || row.address || Object.values(row)[0])
    .filter(Boolean);

  const rows = rowsFromUrls(urls, sourceLabel);
  if (!rows.length) throw new Error("Bundled reference CSV had no usable URLs.");
  return rows;
}

async function getReferenceRows(overrideFile, overrideLabel, bundledLabel) {
  if (overrideFile) {
    log(`Reading ${overrideLabel}: ${overrideFile.name}`);
    return await readAnyTable(overrideFile);
  }

  try {
    const rows = await loadBundledReferenceRows(bundledLabel);
    log(`Using bundled MGB reference file (${rows.length.toLocaleString()} URLs).`);
    return rows;
  } catch (error) {
    const fallbackRows = buildDefaultReferenceRows(`${bundledLabel} fallback`);
    log(`Bundled MGB reference file could not be loaded. Using ${fallbackRows.length.toLocaleString()} core fallback URLs instead.`);
    console.warn(error);
    return fallbackRows;
  }
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

  if (!sourceFile || !manualFile) {
    log("Missing required uploads. Source crawl and manual exclude/key are required.");
    return;
  }

  try {
    log(`Reading source crawl: ${sourceFile.name}`);
    const sourceRows = await readAnyTable(sourceFile);
    log(`Reading manual exclude/key: ${manualFile.name}`);
    const manualRows = await readAnyTable(manualFile);

    const destinationRows = await getReferenceRows(
      destinationFile,
      "MGB destination crawl override",
      "Bundled MGB Destination Reference"
    );

    const iaRows = await getReferenceRows(
      iaFile,
      "MGB IA doc override",
      "Bundled MGB IA Reference"
    );

    log(`Loaded ${sourceRows.length.toLocaleString()} source rows.`);
    log(`Loaded ${manualRows.length.toLocaleString()} manual rows.`);
    log(`Loaded ${destinationRows.length.toLocaleString()} MGB destination reference rows.`);
    if (iaRows.length) log(`Loaded ${iaRows.length.toLocaleString()} IA reference rows.`);

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
