const CORE_MGB_REFERENCE_URLS = [
  ["https://www.massgeneralbrigham.org/en", "Mass General Brigham"],
  ["https://www.massgeneralbrigham.org/en/contact-us", "Contact Us"],
  ["https://www.massgeneralbrigham.org/en/about", "About Us"],
  ["https://www.massgeneralbrigham.org/en/about/careers", "Careers"],
  ["https://www.massgeneralbrigham.org/en/about/careers/benefits", "Benefits"],
  ["https://www.massgeneralbrigham.org/en/about/careers/talent-community", "Talent Community"],
  ["https://www.massgeneralbrigham.org/en/about/volunteer", "Volunteer"],
  ["https://www.massgeneralbrigham.org/en/about/volunteer/opportunities", "Volunteer Opportunities"],
  ["https://www.massgeneralbrigham.org/en/about/newton-wellesley-hospital/giving", "Newton-Wellesley Hospital Giving"],
  ["https://www.massgeneralbrigham.org/en/about/newsroom", "Newsroom"],
  ["https://www.massgeneralbrigham.org/en/about/newsroom/articles", "Newsroom Articles"],
  ["https://www.massgeneralbrigham.org/en/about/newsroom/press-releases", "Press Releases"],
  ["https://www.massgeneralbrigham.org/en/about/advancing-care/health-equity-community-health", "Community Health and Health Equity"],
  ["https://www.massgeneralbrigham.org/en/about/advancing-care/integrated-healthcare-system", "Integrated Healthcare System"],
  ["https://www.massgeneralbrigham.org/en/about/neuroscience-institute", "Neuroscience Institute"],
  ["https://www.massgeneralbrigham.org/en/find-care", "Find Care"],
  ["https://www.massgeneralbrigham.org/en/find-care/request-appointment", "Request Appointment"],
  ["https://www.massgeneralbrigham.org/en/find-care/express-care", "Express Care"],
  ["https://www.massgeneralbrigham.org/en/providers", "Providers"],
  ["https://www.massgeneralbrigham.org/en/locations", "Locations"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations", "Locations"],
  ["https://www.massgeneralbrigham.org/en/patient-care", "Patient Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties", "Services and Specialties"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information", "Patient and Visitor Information"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing", "Billing"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing/questions-about-a-bill", "Questions About a Bill"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing/financial-assistance", "Financial Assistance"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/medical-records", "Medical Records"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/patient-gateway", "Patient Gateway"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/quality-and-safety", "Quality and Safety"],
  ["https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/health-information", "Health Information"],
  ["https://www.massgeneralbrigham.org/en/patient-care/virtual-care", "Virtual Care"],
  ["https://www.massgeneralbrigham.org/en/health-wellness", "Health and Wellness"],
  ["https://www.massgeneralbrigham.org/en/patient-stories", "Patient Stories"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/primary-care", "Primary Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/urgent-care", "Urgent Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/emergency", "Emergency Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/orthopedics", "Orthopedics"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/sports-medicine", "Sports Medicine"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/spine-care", "Spine Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/joint-replacement", "Joint Replacement"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/hand-surgery", "Hand Surgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/foot-and-ankle", "Foot and Ankle"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/radiology-and-imaging", "Radiology and Imaging"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/breast-cancer-screening", "Breast Cancer Screening"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/rehabilitation", "Rehabilitation"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/physical-therapy", "Physical Therapy"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/occupational-therapy", "Occupational Therapy"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/neurology", "Neurology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/neurosurgery", "Neurosurgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/cancer", "Cancer"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/colorectal-surgery", "Colorectal Surgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/colorectal-cancer-screening", "Colorectal Cancer Screening"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/blood-cancer", "Blood Cancer"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/heart", "Heart"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/cardiology", "Cardiology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/cardiac-rehabilitation", "Cardiac Rehabilitation"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/vascular-medicine-and-surgery", "Vascular Medicine and Surgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/obstetrics-and-gynecology", "Obstetrics and Gynecology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/maternal-fetal-medicine", "Maternal Fetal Medicine"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/midwifery", "Midwifery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/lactation-and-breastfeeding", "Lactation and Breastfeeding"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/urology", "Urology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/gastroenterology", "Gastroenterology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/general-surgery", "General Surgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/pain-management", "Pain Management"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/endocrinology", "Endocrinology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/diabetes", "Diabetes"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/diabetes-in-pregnancy", "Diabetes in Pregnancy"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/pulmonary-and-critical-care", "Pulmonary and Critical Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/infectious-diseases", "Infectious Diseases"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/rheumatology", "Rheumatology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/dermatology", "Dermatology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/allergy-and-immunology", "Allergy and Immunology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/ophthalmology", "Ophthalmology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/otolaryngology", "Otolaryngology"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/plastic-surgery", "Plastic Surgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/psychiatry", "Psychiatry"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/pediatric-behavioral-medicine", "Pediatric Behavioral Medicine"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/pediatrics", "Pediatrics"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/sleep-medicine", "Sleep Medicine"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/palliative-care", "Palliative Care"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/addiction-medicine", "Addiction Medicine"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/weight-loss-surgery", "Weight Loss Surgery"],
  ["https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/bariatric-surgery", "Bariatric Surgery"],
  ["https://www.massgeneralbrigham.org/en/education-and-training", "Education and Training"],
  ["https://www.massgeneralbrigham.org/en/education-and-training/graduate-medical-education", "Graduate Medical Education"],
  ["https://www.massgeneralbrigham.org/en/education-and-training/continuing-professional-development", "Continuing Professional Development"],
  ["https://www.massgeneralbrigham.org/en/research-and-innovation", "Research and Innovation"],
  ["https://www.massgeneralbrigham.org/en/research-and-innovation/innovation", "Innovation"],
  ["https://www.massgeneralbrigham.org/en/research-and-innovation/centers-and-programs", "Research Centers and Programs"],
  ["https://www.massgeneralbrigham.org/en/notices", "Notices"],
  ["https://www.massgeneralbrigham.org/en/notices/web-privacy-policy", "Web Privacy Policy"]
];

function buildDefaultReferenceRows(sourceLabel = "Bundled MGB Reference") {
  return CORE_MGB_REFERENCE_URLS.map(([url, title]) => ({
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
  }));
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

    let destinationRows = [];
    if (destinationFile) {
      log(`Reading MGB destination crawl override: ${destinationFile.name}`);
      destinationRows = await readAnyTable(destinationFile);
    } else {
      destinationRows = buildDefaultReferenceRows("Bundled MGB Destination Reference");
      log(`Using bundled MGB destination reference (${destinationRows.length.toLocaleString()} core destinations).`);
    }

    let iaRows = [];
    if (iaFile) {
      log(`Reading IA doc override: ${iaFile.name}`);
      iaRows = await readAnyTable(iaFile);
    } else {
      iaRows = buildDefaultReferenceRows("Bundled MGB IA Reference");
      log(`Using bundled MGB IA reference (${iaRows.length.toLocaleString()} core destinations).`);
    }

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
