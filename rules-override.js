// Rule tuning layer.
// Loaded after app.js and reference-data.js so it can refine matching behavior without rewriting the base app.

const MGB_DESTINATIONS = {
  nwhLocation: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/newton-wellesley-hospital",
  providers: "https://www.massgeneralbrigham.org/en/providers",
  services: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties",
  patientVisitor: "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information",
  billing: "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing",
  financialAssistance: "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/financial-assistance",
  medicalRecords: "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/medical-records",
  patientGateway: "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/patient-gateway",
  visitorPolicy: "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/planning-your-visit/visitor-policy",
  careers: "https://www.massgeneralbrigham.org/en/about/careers",
  giving: "https://www.massgeneralbrigham.org/en/about/newton-wellesley-hospital/giving",
  imaging: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/imaging",
  orthopedics: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/orthopedics",
  orthoSpine: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/orthopedics/conditions/spine",
  sportsMedicine: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/sports-medicine",
  rehabilitation: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/rehabilitation",
  cancer: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/cancer",
  obgynConcept: "https://www.massgeneralbrigham.org/en/about/complex-obstetrics-and-gynecology-care",
  painManagement: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/pain-management",
  mentalHealth: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/mental-health-psychiatry",
  sleepMedicine: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/sleep-medicine",
  pediatrics: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/pediatrics",
  primaryCare: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/primary-care",
  emergency: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/emergency",
  diabetes: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/diabetes",
  diabetesPregnancy: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/diabetes-in-pregnancy",
  gastroenterology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/gastroenterology",
  infectiousDisease: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/infectious-diseases",
  neurology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/neuroscience/neurology",
  urology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/urology",
  dermatology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/dermatology",
  allergy: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/allergy-and-immunology",
  ophthalmology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/ophthalmology",
  rheumatology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/rheumatology",
  heart: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/heart",
  cardiology: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/heart/cardiology",
  bariatric: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/weight-loss-surgery",
  homeCare: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/home-care",
};

function textForRow(row) {
  return `${row.sourceUrl || ""} ${row.title || ""} ${row.h1 || ""} ${row.metaDescription || ""} ${row.h2 || ""}`.toLowerCase();
}

function pathForRow(row) {
  return pathFromUrl(row.sourceUrl || "").toLowerCase();
}

function destinationHost(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
}

function isPrimaryMgbDestination(url) {
  const host = destinationHost(url);
  return (host === "www.massgeneralbrigham.org" || host === "massgeneralbrigham.org") && pathFromUrl(url).startsWith("/en/");
}

function isBadGeneralPurposeDestination(url) {
  const lower = String(url || "").toLowerCase();
  return lower.includes("/about/newsroom/") ||
    lower.includes("/press-releases/") ||
    lower.includes("/patient-stories/") ||
    lower.includes("/locations/") ||
    lower.includes("/fraud-alert") ||
    lower.includes("/pfac-apply-thank-you");
}

function isErrorStatus(row) {
  const status = String(row.statusCode || row["Status Code"] || "").trim();
  return /^4\d\d/.test(status) || /^5\d\d/.test(status);
}

function isLegacyCodeLookingSource(row) {
  const url = String(row.sourceUrl || "").toLowerCase();
  return url.includes("contentpage.aspx") || (/[?&]id=\d+/.test(url) && /[?&]nd=\d+/.test(url));
}

function isGiftOrDevelopmentHumanReview(row) {
  const text = textForRow(row);
  const path = pathForRow(row);
  return path.includes("gift-shop") ||
    text.includes("gift shop") ||
    path.includes("giftplanning") ||
    text.includes("gift planning") ||
    text.includes("planned giving") ||
    path.includes("/development-office/");
}

function isGuideOrArticleLikeSource(row) {
  const text = textForRow(row);
  return text.includes("/patient-guides-and-forms/") ||
    text.includes("/maternity-guide/") ||
    text.includes("/postpartum-guide/") ||
    text.includes("/events/") ||
    text.includes("/classes") ||
    text.includes("/workshops") ||
    text.includes("patient guide") ||
    text.includes("patient story") ||
    text.includes("patient-stories") ||
    text.includes("chapter ");
}

function isVolunteerProgramSource(row) {
  const text = textForRow(row);
  return text.includes("volunteer program") || text.includes("/volunteer-program") || text.includes("adult volunteer") || text.includes("college volunteer");
}

function isServiceSectionSource(row) {
  const path = pathForRow(row);
  return path.includes("/medical-services/") ||
    path.includes("/orthopedics/") ||
    path.includes("/mass-general-cancer-center/") ||
    path.includes("/radiology/") ||
    path.includes("/maternity/") ||
    path.includes("/rehabilitation-services/") ||
    path.includes("/elfers-cardiovascular-center/") ||
    path.includes("/center-for-weight-loss-surgery/") ||
    path.includes("/surgical-services/") ||
    path.includes("/medicine-specialties/");
}

function route(destinationUrl, rule, notes, score = 0.9) {
  return { destinationUrl, rule, notes, score };
}

function human(destinationUrl, rule, notes, score = 0.25) {
  return { bucket: "human", destinationUrl: destinationUrl || "", rule, notes, score };
}

function redirect(destinationUrl, rule, notes, score = 0.9) {
  return { bucket: "redirect", destinationUrl, rule, notes, score };
}

// output-format.js uses this pointer so it can run the base workbook builder while still
// using the rule overrides in this file.
const originalProcessRowsForRules = processRows;

function normalizeManualRows(rows) {
  if (!rows || !rows.length) return rows || [];

  const headerIndex = rows.findIndex((row) => Object.values(row || {}).some((value) => String(value).trim().toLowerCase() === "current url" || String(value).trim().toLowerCase() === "existing url"));
  let normalizedRows = rows;

  if (headerIndex >= 0) {
    const headerValues = Object.values(rows[headerIndex]).map((value) => String(value || "").trim());
    normalizedRows = rows.slice(headerIndex + 1).map((row) => {
      const values = Object.values(row);
      const rebuilt = {};
      headerValues.forEach((header, index) => {
        if (header) rebuilt[header] = values[index] == null ? "" : String(values[index]).trim();
      });
      return rebuilt;
    });
  }

  return normalizedRows
    .map((row) => {
      const existingUrl = detectUrl(row, ["Existing URL", "Current URL", "Address", "URL", "Source URL", "Legacy URL"]);
      if (!existingUrl) return null;
      const seoNotes = valueFor(row, ["829 Notes", "SEO Notes", "Notes", "Recommended Action"]);
      const otherNotes = valueFor(row, ["Notes", "Recommended Action"]);
      const notes = [seoNotes, otherNotes].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join(" | ");
      return {
        "Existing URL": existingUrl,
        "Destination URL": valueFor(row, ["Destination URL", "Final URL", "Mapped URL", "Target URL"]),
        "Notes": notes,
      };
    })
    .filter(Boolean);
}

function findBestCandidate(row, destinationCandidates) {
  const sourceText = `${row.sourceUrl} ${row.title} ${row.h1} ${row.metaDescription} ${row.h2}`;
  const sourceTokens = tokenize(sourceText);
  const sourceIsNews = isNewsOrArticle(row.sourceUrl, row.title, row.h1);
  const sourceIsLocation = isLocationPage(row.sourceUrl, row.title, row.h1);
  let best = null;

  destinationCandidates.forEach((candidate) => {
    if (!isPrimaryMgbDestination(candidate.destinationUrl)) return;
    if (!sourceIsNews && !sourceIsLocation && isBadGeneralPurposeDestination(candidate.destinationUrl)) return;
    if (!sourceIsNews && candidate.destinationUrl.includes("/about/newsroom/")) return;
    const score = scoreTokens(sourceTokens, candidate.tokens, row.sourceUrl, candidate.destinationUrl);
    if (!best || score > best.score) {
      best = { ...candidate, score, reason: `Best match from ${candidate.Source}; token/path similarity ${percent(score)}.` };
    }
  });
  return best;
}

function bestCandidateForTerms(destinationCandidates, terms) {
  let best = null;
  destinationCandidates.forEach((candidate) => {
    if (!isPrimaryMgbDestination(candidate.destinationUrl)) return;
    if (isBadGeneralPurposeDestination(candidate.destinationUrl)) return;
    const text = candidate.text.toLowerCase();
    let score = 0;
    terms.forEach((term) => { if (text.includes(term.toLowerCase())) score += 1; });
    if (candidate.destinationUrl.includes("/en/patient-care/services-and-specialties")) score += 0.3;
    if (candidate.destinationUrl.includes("/en/patient-care/patient-visitor-information")) score += 0.2;
    if (score > 0 && (!best || score > best.score)) {
      best = { destinationUrl: candidate.destinationUrl, score: Math.min(score / Math.max(terms.length, 1), 0.9) };
    }
  });
  return best;
}

function serviceConceptRoute(row) {
  const text = textForRow(row);

  if (text.includes("diabetes in pregnancy") || text.includes("gestational diabetes")) return route(MGB_DESTINATIONS.diabetesPregnancy, "Gestational diabetes mapped to diabetes-in-pregnancy content", "Gestational diabetes mapped to diabetes-in-pregnancy content", 0.9);
  if (text.includes("endocrinology") || text.includes("diabetes")) return route(MGB_DESTINATIONS.diabetes, "Diabetes/endocrinology mapped to MGB Diabetes", "Diabetes/endocrinology mapped to MGB Diabetes", 0.9);
  if (text.includes("weight loss") || text.includes("bariatric")) return route(MGB_DESTINATIONS.bariatric, "Weight loss/bariatric content mapped to Weight Loss Surgery", "Weight loss/bariatric content mapped to Weight Loss Surgery", 0.9);
  if (text.includes("spine")) return route(MGB_DESTINATIONS.orthoSpine, "Spine mapped to MGB orthopedics spine page", "Spine mapped to MGB orthopedics spine page", 0.9);
  if (text.includes("sports medicine")) return route(MGB_DESTINATIONS.sportsMedicine, "Sports medicine mapped to MGB Sports Medicine", "Sports medicine mapped to MGB Sports Medicine", 0.9);
  if (text.includes("joint") || text.includes("kaplan") || text.includes("orthopedic") || text.includes("orthopedics")) return route(MGB_DESTINATIONS.orthopedics, "Orthopedics mapped to MGB Orthopedics", "Orthopedics mapped to MGB Orthopedics", 0.9);
  if (text.includes("ct scan") || text.includes("radiology") || text.includes("imaging") || text.includes("mri") || text.includes("ultrasound") || text.includes("x-ray")) return route(MGB_DESTINATIONS.imaging, "Radiology/imaging mapped to MGB Imaging", "Radiology/imaging mapped to MGB Imaging", 0.88);
  if (text.includes("rehabilitation") || text.includes("physical therapy") || text.includes("occupational therapy") || text.includes("hand therapy")) return route(MGB_DESTINATIONS.rehabilitation, "Rehabilitation mapped to MGB Rehabilitation", "Rehabilitation mapped to MGB Rehabilitation", 0.9);
  if (text.includes("maternity") || text.includes("obstetrics") || text.includes("gynecology") || text.includes("ob-gyn") || text.includes("obgyn") || text.includes("childbirth") || text.includes("women's health") || text.includes("womens health")) return route(MGB_DESTINATIONS.obgynConcept, "Maternity/OB-GYN mapped to OB/GYN concept", "Maternity mapped to OB/GYN concept", 0.88);
  if (text.includes("breast") || text.includes("cancer") || text.includes("oncology") || text.includes("tumor")) return route(MGB_DESTINATIONS.cancer, "Cancer mapped to MGB Cancer Institute", "Cancer mapped to MGB Cancer Institute", 0.9);
  if (text.includes("heart failure") || text.includes("cardiology") || text.includes("cardiovascular")) return route(MGB_DESTINATIONS.cardiology, "Cardiology/cardiovascular mapped to MGB Cardiology", "Cardiology/cardiovascular mapped to MGB Cardiology", 0.9);
  if (text.includes("heart")) return route(MGB_DESTINATIONS.heart, "Heart content mapped to MGB Heart", "Heart content mapped to MGB Heart", 0.88);
  if (text.includes("primary care")) return route(MGB_DESTINATIONS.primaryCare, "Primary care mapped to Primary Care", "Primary care mapped to Primary Care", 0.9);
  if (text.includes("emergency") || text.includes("er wait") || text.includes("urgent care")) return route(MGB_DESTINATIONS.emergency, "Emergency mapped to Emergency Care", "Emergency mapped to Emergency Care", 0.85);
  if (text.includes("pain management")) return route(MGB_DESTINATIONS.painManagement, "Pain management mapped to MGB Pain Management", "Pain management mapped to MGB Pain Management", 0.9);
  if (text.includes("psychiatry") || text.includes("mental health") || text.includes("substance use")) return route(MGB_DESTINATIONS.mentalHealth, "Mental health mapped to MGB Mental Health Psychiatry", "Mental health mapped to MGB Mental Health Psychiatry", 0.9);
  if (text.includes("sleep")) return route(MGB_DESTINATIONS.sleepMedicine, "Sleep mapped to MGB Sleep Medicine", "Sleep mapped to MGB Sleep Medicine", 0.9);
  if (text.includes("pediatric")) return route(MGB_DESTINATIONS.pediatrics, "Pediatrics mapped to MGB Pediatrics", "Pediatrics mapped to MGB Pediatrics", 0.9);
  if (text.includes("gastro") || text.includes("digestive") || text.includes("heartburn")) return route(MGB_DESTINATIONS.gastroenterology, "Gastroenterology mapped to MGB Gastroenterology", "Gastroenterology mapped to MGB Gastroenterology", 0.88);
  if (text.includes("infectious")) return route(MGB_DESTINATIONS.infectiousDisease, "Infectious diseases mapped to MGB Infectious Disease", "Infectious diseases mapped to MGB Infectious Disease", 0.88);
  if (text.includes("stroke") || text.includes("neurology")) return route(MGB_DESTINATIONS.neurology, "Stroke/neurology mapped to MGB Neurology", "Stroke/neurology mapped to MGB Neurology", 0.88);
  if (text.includes("urology")) return route(MGB_DESTINATIONS.urology, "Urology mapped to MGB Urology", "Urology mapped to MGB Urology", 0.88);
  if (text.includes("dermatology")) return route(MGB_DESTINATIONS.dermatology, "Dermatology mapped to MGB Dermatology", "Dermatology mapped to MGB Dermatology", 0.88);
  if (text.includes("allergy") || text.includes("immunology")) return route(MGB_DESTINATIONS.allergy, "Allergy/immunology mapped to MGB Allergy & Immunology", "Allergy/immunology mapped to MGB Allergy & Immunology", 0.88);
  if (text.includes("ophthalmology")) return route(MGB_DESTINATIONS.ophthalmology, "Ophthalmology mapped to MGB Ophthalmology", "Ophthalmology mapped to MGB Ophthalmology", 0.88);
  if (text.includes("rheumatology")) return route(MGB_DESTINATIONS.rheumatology, "Rheumatology mapped to MGB Rheumatology", "Rheumatology mapped to MGB Rheumatology", 0.88);
  if (text.includes("home care")) return route(MGB_DESTINATIONS.homeCare, "Home care mapped to MGB Home Care", "Home care mapped to MGB Home Care", 0.88);
  return null;
}

function categoryFallback(row, destinationCandidates) {
  const text = textForRow(row);
  const path = pathForRow(row);

  if (isGuideOrArticleLikeSource(row) || isVolunteerProgramSource(row) || isGiftOrDevelopmentHumanReview(row)) return null;

  if (path === "/" || path === "") {
    return route(MGB_DESTINATIONS.nwhLocation, "Root/home mapped to NWH location page", "Root/home mapped to NWH location page", 0.9);
  }

  if (text.includes("find-a-doctor") || text.includes("find a doctor") || text.includes("provider") || text.includes("doctor profile")) {
    return route(MGB_DESTINATIONS.providers, "Provider/FAD URL mapped to centralized provider directory", "Provider/FAD URL mapped to centralized provider directory unless manually mapped 1:1", 0.9);
  }

  const serviceRoute = serviceConceptRoute(row);
  if (serviceRoute) return serviceRoute;

  if (text.includes("billing") || text.includes("insurance") || text.includes("charge data")) return route(MGB_DESTINATIONS.billing, "Billing/insurance mapped to MGB Billing", "Billing/insurance mapped to MGB Billing", 0.86);
  if (text.includes("financial assistance")) return route(MGB_DESTINATIONS.financialAssistance, "Financial assistance mapped to MGB Financial Assistance", "Financial assistance mapped to MGB Financial Assistance", 0.9);
  if (text.includes("medical records")) return route(MGB_DESTINATIONS.medicalRecords, "Medical records mapped to MGB Medical Records", "Medical records mapped to MGB Medical Records", 0.9);
  if (text.includes("patient gateway")) return route(MGB_DESTINATIONS.patientGateway, "Patient Gateway category fallback", "Patient Gateway mapped to MGB Patient Gateway", 0.9);

  if (text.includes("careers") || text.includes("job") || text.includes("employment") || text.includes("workforce development")) return route(MGB_DESTINATIONS.careers, "Career URL mapped to MGB Careers", "Career URL mapped to MGB Careers", 0.9);

  if (text.includes("giving") || text.includes("gift") || text.includes("donor") || text.includes("fund")) return route(MGB_DESTINATIONS.giving, "Giving content mapped to NWH giving", "General giving content mapped to NWH giving. Development-office, gift-planning, and gift-shop URLs are held for HUMAN CHECK before this rule.", 0.8);

  if (!isServiceSectionSource(row) && (text.includes("directions") || text.includes("parking") || text.includes("visiting hours") || text.includes("hours and locations"))) {
    return route(MGB_DESTINATIONS.nwhLocation, "Location/directions/contact mapped to NWH location page", "Location/directions/contact mapped to NWH location page", 0.85);
  }

  if (text.includes("visitor") || text.includes("visiting") || text.includes("mask policy")) return route(MGB_DESTINATIONS.visitorPolicy, "Visitor information mapped to MGB visitor policy/planning content", "Visitor information mapped to MGB visitor policy/planning content", 0.82);

  if (text.includes("patient") || text.includes("patients-and-visitors") || text.includes("classes-and-resources")) return route(MGB_DESTINATIONS.patientVisitor, "Patient/visitor resource mapped to MGB patient/visitor information", "Patient/visitor resource mapped to MGB patient/visitor information", 0.78);

  if (!isServiceSectionSource(row) && (path.includes("/about-us") || path.includes("/contact-us"))) {
    if (path.includes("press-room")) return null;
    return route(MGB_DESTINATIONS.nwhLocation, "About/general hospital content mapped to NWH location page", "About/general hospital content mapped to NWH location page", 0.85);
  }

  if (text.includes("surgery") || text.includes("procedure") || text.includes("treatment") || text.includes("medical-services")) {
    return route(MGB_DESTINATIONS.services, "Surgery/procedure page mapped to Services parent", "Surgery/procedure page mapped to Services parent; review if procedure-specific page needed", 0.72);
  }

  return null;
}

function decideMapping(row, destinationCandidates) {
  const sourceUrl = row.sourceUrl;
  const redirectUrl = row.redirectUrl || "";

  if (redirectUrl.includes("massgeneralbrigham.org") && isValidUrl(redirectUrl) && isPrimaryMgbDestination(redirectUrl)) {
    return redirect(redirectUrl, "Existing MGB redirect URL found in crawl", "Source crawl already included an MGB redirect destination.", 1);
  }

  if (isErrorStatus(row)) {
    return human("", "HTTP error status requires HUMAN CHECK", "4xx/5xx HTML URL. Review before choosing a redirect destination.", 0);
  }

  if (isLegacyCodeLookingSource(row)) {
    const suggested = textForRow(row).includes("provider") || textForRow(row).includes("doctor") || textForRow(row).includes("find-a-doctor") ? MGB_DESTINATIONS.providers : "";
    return human(suggested, "Legacy code-style URL requires HUMAN CHECK", "Legacy ContentPage.aspx or id/nd style URL. Use /en/providers only if the page is confirmed provider/FAD content.", 0.25);
  }

  // Locked behavior from the reference-workbook decision: provider detail/profile pages map to /en/providers.
  if (isProviderDetail(sourceUrl)) return redirect(MGB_DESTINATIONS.providers, "Provider/FAD URL mapped to centralized provider directory", "Provider/FAD URL mapped to centralized provider directory unless manually mapped 1:1", 0.9);
  if (isProviderDirectory(sourceUrl)) return redirect(MGB_DESTINATIONS.providers, "Provider directory mapped to centralized provider directory", "Provider directory pages map to the MGB provider directory.", 0.9);

  const best = findBestCandidate(row, destinationCandidates);

  if (isNewsOrArticle(sourceUrl, row.title, row.h1)) {
    if (best && best.score >= 0.84 && best.destinationUrl.includes("/about/newsroom/")) return redirect(best.destinationUrl, "Strong newsroom article match", "Mapped only because a strong specific MGB Newsroom destination was found.", best.score);
    return human(best?.destinationUrl || "", "News / article / press release requires HUMAN CHECK", NEWS_HUMAN_CHECK_NOTE, best?.score || 0);
  }

  if (isGiftOrDevelopmentHumanReview(row)) {
    const suggested = pathForRow(row).includes("gift-shop") || textForRow(row).includes("gift shop") ? "" : MGB_DESTINATIONS.giving;
    return human(suggested, "Gift shop / development / gift planning requires HUMAN CHECK", "Gift shop, development-office, and gift-planning URLs should not be force-mapped to Giving without review.", 0.25);
  }

  if (isGuideOrArticleLikeSource(row)) {
    return human(best?.destinationUrl || "", "Guide / event / patient story requires HUMAN CHECK", "Guide, event, class, workshop, or patient-story style content should not be force-mapped unless there is a strong specific destination.", best?.score || 0);
  }

  const categoryCandidate = categoryFallback(row, destinationCandidates);

  if (isLocationPage(sourceUrl, row.title, row.h1)) {
    if (categoryCandidate) return redirect(categoryCandidate.destinationUrl, categoryCandidate.rule, categoryCandidate.notes, categoryCandidate.score);
    if (best && best.score >= 0.78 && destinationLooksLikeLocation(best.destinationUrl, best.text)) return redirect(best.destinationUrl, "Strong location destination match", "Location page mapped because a strong MGB location candidate was found.", best.score);
    return human(best?.destinationUrl || "", "Location page requires HUMAN CHECK", "Location pages should not be force-mapped unless a matching MGB location page exists.", best?.score || 0);
  }

  // Curated category/IA logic now beats fuzzy matching. This avoids best-looking-but-wrong URLs.
  if (categoryCandidate) return redirect(categoryCandidate.destinationUrl, categoryCandidate.rule, categoryCandidate.notes || "Category fallback used because a page-level match was not strong enough.", categoryCandidate.score);

  if (best && best.score >= 0.78 && isPrimaryMgbDestination(best.destinationUrl) && !isBadGeneralPurposeDestination(best.destinationUrl)) return redirect(best.destinationUrl, "Destination crawl fuzzy match", best.reason, best.score);

  return human(best?.destinationUrl || "", "No confident destination match", "No confident IA or destination crawl match. Review manually.", best?.score || 0);
}
