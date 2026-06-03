// Final QA tuning layer.
// Loaded after rules-deep-research.js and before output-format.js.
// This keeps the deep-research workbook behavior but tightens remaining edge cases.

// Provider discrepancy policy: keep provider/FAD redirects aligned with the MGB reference workbook.
MGB_DESTINATIONS.providers = "https://www.massgeneralbrigham.org/en/providers";

function ftPath(row) { return pathFromUrl(row.sourceUrl || "").toLowerCase(); }
function ftText(row) { return textForRow(row); }
function ftDest(row) { return String(row.destinationUrl || row["Destination URL"] || "").toLowerCase(); }

function ftIsBroadSurgeryOrUnverifiedSpecialty(row) {
  const path = ftPath(row);
  const text = ftText(row);
  return path.includes("/neurosurgery") ||
    path.includes("/thoracic-surgery") ||
    path.includes("/endocrine-surgery") ||
    path.includes("/robotic-surgery") ||
    path.includes("/pre-surgery-information") ||
    path.includes("/surgical-discharge-instructions") ||
    text.includes("thoracic surgery") ||
    text.includes("endocrine surgery") ||
    text.includes("neurosurgery") ||
    text.includes("pre-surgery") ||
    text.includes("surgical discharge instructions");
}

function ftIsLocationPath(row) {
  return ftPath(row).includes("/locations/");
}

function ftIsStoryLike(row) {
  const path = ftPath(row);
  const text = ftText(row);
  return path.includes("patient-testimonials") ||
    path.includes("patient-success-stories") ||
    path.includes("success-stories") ||
    path.includes("patient-reviews") ||
    path.includes("testimonials-from-our-residents") ||
    /\/[a-z0-9-]+s-story(\/|$)/.test(path) ||
    text.includes("patient testimonials") ||
    text.includes("success stories") ||
    text.includes("patient reviews") ||
    text.includes("testimonials from our residents");
}

function ftIsPressOrNews(row) {
  const path = ftPath(row);
  const text = ftText(row);
  return path.includes("/press-room") ||
    path.includes("/in-the-news") ||
    path.includes("/public-notice") ||
    path.includes("/media-inquiries") ||
    text.includes("press room") ||
    text.includes("in the news") ||
    text.includes("public notice") ||
    text.includes("media inquiries");
}

function ftIsIcu(row) {
  const path = ftPath(row);
  const text = ftText(row);
  return path.includes("/intensive-care-unit") || text.includes("intensive care unit");
}

function ftIsProviderOnly(row) {
  const path = ftPath(row);
  return path.includes("/find-a-doctor/") || path.includes("/docs/details");
}

const decideMappingBeforeFinalTuning = decideMapping;
decideMapping = function finalTuningDecideMapping(row, destinationCandidates) {
  if (ftIsProviderOnly(row)) {
    return redirect(MGB_DESTINATIONS.providers, "Provider/FAD URL mapped to MGB Providers", "Find-a-doctor/profile-style URL mapped to the reference MGB provider directory, not the provider microsite.", 0.95);
  }

  if (ftIsPressOrNews(row)) {
    return human(hospitalProfileForSource(row) || "", "Press/news content requires HUMAN CHECK", "Press room, in-the-news, public notice, and media inquiry pages should be reviewed manually rather than mapped to a hospital/location page.", 0.25);
  }

  if (ftIsStoryLike(row)) {
    return human("", "Story/testimonial content requires HUMAN CHECK", "Testimonials, patient stories, resident testimonials, workforce stories, reviews, and success stories should be reviewed manually before redirecting.", 0.25);
  }

  if (ftIsLocationPath(row)) {
    const best = findBestCandidate(row, destinationCandidates);
    if (best && best.score >= 0.88 && destinationLooksLikeLocation(best.destinationUrl, best.text)) {
      return redirect(best.destinationUrl, "Strong exact location match", "Location URL mapped only because a strong same-family MGB location candidate was found.", best.score);
    }
    return human(hospitalProfileForSource(row) || MGB_DESTINATIONS.nwhLocation, "Location URL requires HUMAN CHECK", "Location/building/directions URLs should not map to a service page unless an exact MGB location exists.", best?.score || 0.25);
  }

  if (ftIsIcu(row)) {
    return human("", "ICU content requires HUMAN CHECK", "Intensive care unit pages do not have a verified specific MGB destination in the current rule set.", 0.3);
  }

  if (ftIsBroadSurgeryOrUnverifiedSpecialty(row)) {
    return human("", "Unverified surgical specialty requires HUMAN CHECK", "Neurosurgery, thoracic surgery, endocrine surgery, robotic surgery, pre-surgery, and surgical-discharge pages are too specific for the broad Services parent without a verified destination.", 0.3);
  }

  const decision = decideMappingBeforeFinalTuning(row, destinationCandidates);
  const destination = String(decision?.destinationUrl || "").replace(/\/$/, "");
  if (decision?.bucket === "redirect" && destination === "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties") {
    return human(decision.destinationUrl, "Broad Services parent requires HUMAN CHECK", "The automated result was only the broad Services parent. Review for a more specific destination before including in CSV.", decision.score || 0.3);
  }
  if (decision?.bucket === "redirect" && destination === "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information") {
    const path = ftPath(row);
    if (!path.includes("/patients-and-visitors/")) {
      return human(decision.destinationUrl, "Broad Patient/Visitor parent requires HUMAN CHECK", "The automated result was only the broad Patient/Visitor parent for non-patient-visitor content. Review manually.", decision.score || 0.3);
    }
  }
  return decision;
};
