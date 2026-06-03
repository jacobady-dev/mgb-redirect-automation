// Small post-rules patch layer.
// Use this for targeted QA corrections without rewriting the full rule-tuning file.

MGB_DESTINATIONS.educationTraining = "https://www.massgeneralbrigham.org/en/education-and-training";
MGB_DESTINATIONS.medicalProfessionals = MGB_DESTINATIONS.educationTraining;
MGB_DESTINATIONS.planningVisit = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/planning-your-visit";
MGB_DESTINATIONS.hipaa = "https://www.massgeneralbrigham.org/en/notices/hipaa";
MGB_DESTINATIONS.patientRights = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/patient-rights";
MGB_DESTINATIONS.notices = "https://www.massgeneralbrigham.org/en/notices";
MGB_DESTINATIONS.childbirthEducation = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/newton-wellesley-childbirth-education";

function patchHost(row) {
  try { return new URL(row.sourceUrl || "").hostname.toLowerCase(); } catch { return ""; }
}

function patchPath(row) {
  return pathForRow(row);
}

function patchText(row) {
  return textForRow(row);
}

function isGiftPlanningHost(row) {
  return patchHost(row).includes("giftplanning.nwh.org");
}

function isGivingHost(row) {
  return patchHost(row).includes("giving.nwh.org");
}

function isDocsProviderSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/docs/details") || text.includes("physician_id=");
}

function isCareerSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/careers/") || path === "/careers" || text.includes("careers") || text.includes("employment");
}

function isPressOrNewsSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/press-room") ||
    path.includes("/in-the-news") ||
    path.includes("/public-notice") ||
    path.includes("/media-inquiries") ||
    text.includes("press room") ||
    text.includes("in the news") ||
    text.includes("public notice") ||
    text.includes("media inquiries");
}

function isStoryOrTestimonialSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("patient-testimonials") ||
    path.includes("patient-success-stories") ||
    path.includes("success-stories") ||
    path.includes("/patient-reviews") ||
    /\/[a-z0-9-]+s-story(\/|$)/.test(path) ||
    text.includes("patient testimonials") ||
    text.includes("success stories") ||
    text.includes("patient reviews");
}

function isFormOrThankYouSource(row) {
  const path = patchPath(row);
  return path.includes("thank-you") ||
    path.includes("rsvp") ||
    path.includes("registration") ||
    path.includes("contact-form") ||
    path.includes("request-a-virtual-appointment");
}

function isHipaaSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("hipaa") || text.includes("hipaa");
}

function isPatientRightsSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("patient-rights-responsibilities") ||
    path.includes("patient-rights-responsibilities") ||
    path.includes("your-rights-patient") ||
    (text.includes("patient rights") && text.includes("responsibilities"));
}

function isLegalNoticeSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("legal-statements") ||
    path.includes("nondiscrimination") ||
    text.includes("legal statements") ||
    text.includes("nondiscrimination");
}

function isLocationDirectorySource(row) {
  return patchPath(row).includes("/locations/");
}

function isLactationOrBreastfeedingSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("lactationbreastfeeding") ||
    text.includes("lactation") ||
    text.includes("breastfeeding") ||
    text.includes("newborn feeding") ||
    text.includes("breast milk") ||
    text.includes("breast pump") ||
    text.includes("breast pumps");
}

function isChildbirthEducationSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/maternity/childbirth-education") ||
    text.includes("childbirth education") ||
    text.includes("cesarean birth class") ||
    text.includes("spinning babies") ||
    text.includes("infant care") ||
    text.includes("natural childbirth");
}

function isPlanningVisitResource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/planning-your-visit/hotels") ||
    path.includes("/planning-your-visit/shuttle") ||
    path.includes("/planning-your-visit/public-transportation") ||
    path.includes("/planning-your-visit/free-wi-fi") ||
    path.includes("/planning-your-visit/phone-numbers") ||
    path.includes("/planning-your-visit/find-a-departments-location") ||
    path.includes("/patients-and-visitors/pre-registration") ||
    text.includes("hotels") ||
    text.includes("shuttle") ||
    text.includes("taxi") ||
    text.includes("public transportation") ||
    text.includes("free wi-fi") ||
    text.includes("phone numbers") ||
    text.includes("pre-registration");
}

function isPatientServiceResource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/patients-and-visitors/services/interpreter") ||
    path.includes("/patients-and-visitors/services/servicios") ||
    path.includes("/patients-and-visitors/services/veterans") ||
    path.includes("/patients-and-visitors/services/services") ||
    text.includes("interpreter services") ||
    text.includes("veterans services");
}

function isPsychiatryPath(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/psychiatry") ||
    path.includes("/substance-use") ||
    text.includes("psychiatry") ||
    text.includes("behavioral health") ||
    text.includes("substance use");
}

function isHeartburnGerdSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("heartburn-center") || text.includes("heartburn") || text.includes("gerd") || text.includes("reflux");
}

function isSportsMedicinePath(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("sports-medicine") || path.includes("sport-medicine") || text.includes("sports medicine") || text.includes("sport medicine");
}

function isWomensHealthSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("womens-health-center") ||
    path.includes("center-for-minimally-invasive-gynecologic-surgery") ||
    path.includes("obstetrics-and-gynecology") ||
    text.includes("gynecologic") ||
    text.includes("gynecology") ||
    text.includes("endometriosis") ||
    text.includes("adenomyosis") ||
    text.includes("hysterectomy") ||
    text.includes("hysteroscopy") ||
    text.includes("infertility") ||
    text.includes("fertility");
}

function isPediatricsSource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return path.includes("/pediatrics") || text.includes("pediatric") || text.includes("massgeneral for children");
}

function isPediatricEmergencySource(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return isPediatricsSource(row) && (path.includes("emergency-room") || text.includes("emergency room"));
}

function isGivingForSpecificService(row) {
  const text = patchText(row);
  const path = patchPath(row);
  return isGivingHost(row) && (
    path.includes("mgcc") ||
    path.includes("kaplan") ||
    text.includes("cancer") ||
    text.includes("kaplan")
  );
}

const decideMappingBeforePatch = decideMapping;
decideMapping = function patchedDecideMapping(row, destinationCandidates) {
  const best = findBestCandidate(row, destinationCandidates);

  // Host-level guardrails should run before keyword logic.
  if (isGiftPlanningHost(row)) {
    return human(MGB_DESTINATIONS.giving, "Gift planning host requires HUMAN CHECK", "giftplanning.nwh.org URLs should not be force-mapped; suggested destination is NWH Giving.", 0.25);
  }

  if (isGivingHost(row)) {
    return redirect(MGB_DESTINATIONS.giving, "Giving host mapped to NWH Giving", "giving.nwh.org URLs mapped to NWH Giving; service-specific giving URLs still land on the Giving destination rather than service pages.", 0.9);
  }

  if (isDocsProviderSource(row)) {
    return redirect(MGB_DESTINATIONS.providers, "Provider docs URL mapped to centralized provider directory", "Legacy docs/details physician URL mapped to MGB providers directory.", 0.9);
  }

  // Careers pages must not get caught by generic medical-education/for-physicians logic.
  if (isCareerSource(row)) {
    return redirect(MGB_DESTINATIONS.careers, "Career URL mapped to MGB Careers", "Careers and careers-for-physicians URLs mapped to MGB Careers.", 0.9);
  }

  if (isHipaaSource(row)) {
    return redirect(MGB_DESTINATIONS.hipaa, "HIPAA page mapped to MGB HIPAA notice", "HIPAA content mapped to the MGB HIPAA notice.", 0.95);
  }

  if (isPatientRightsSource(row)) {
    return redirect(MGB_DESTINATIONS.patientRights, "Patient rights mapped to MGB patient rights", "Patient rights and responsibilities content mapped to MGB Patient Rights.", 0.95);
  }

  if (isLegalNoticeSource(row)) {
    return human(MGB_DESTINATIONS.notices, "Legal / nondiscrimination notice requires HUMAN CHECK", "Legal statement or nondiscrimination content should be reviewed against MGB Notices rather than visitor policy.", 0.25);
  }

  if (isLocationDirectorySource(row)) {
    if (best && best.score >= 0.86 && destinationLooksLikeLocation(best.destinationUrl, best.text)) {
      return redirect(best.destinationUrl, "Strong location destination match", "Location URL mapped only because a strong MGB location candidate was found.", best.score);
    }
    return human(hospitalProfileForSource(row) || "", "Location URL requires HUMAN CHECK", "Location URLs should not be force-mapped to service pages unless an exact/strong MGB location exists.", best?.score || 0);
  }

  if (isPressOrNewsSource(row)) {
    return human(best?.destinationUrl || "", "Press / news content requires HUMAN CHECK", "Press room, in-the-news, public notice, and media inquiry URLs should not be mapped to hospital location pages without review.", best?.score || 0);
  }

  if (isStoryOrTestimonialSource(row)) {
    return human(best?.destinationUrl || "", "Story / testimonial content requires HUMAN CHECK", "Patient stories, success stories, testimonials, and reviews should not be force-mapped to service parent pages.", best?.score || 0);
  }

  if (isFormOrThankYouSource(row)) {
    return human("", "Form / thank-you / registration URL requires HUMAN CHECK", "Form, RSVP, registration, request, and thank-you URLs should be reviewed before redirecting.", 0.25);
  }

  if (isMedicalEducationSource(row)) {
    return redirect(
      MGB_DESTINATIONS.educationTraining,
      "Medical education mapped to MGB Education and Training",
      "Medical education, physician education, and professional training content mapped to MGB Education and Training.",
      0.9
    );
  }

  if (isSpiritualCareSource(row)) {
    return human(MGB_DESTINATIONS.patientVisitor, "Spiritual care / multifaith content requires HUMAN CHECK", "Spiritual care or multifaith prayer content should not be force-mapped to visitor policy. Review against patient/visitor resources.", 0.25);
  }

  if (isChildbirthEducationSource(row)) {
    const path = patchPath(row);
    if (path === "/maternity/childbirth-education" || path === "/maternity/childbirth-education/") {
      return redirect(MGB_DESTINATIONS.childbirthEducation, "Childbirth education landing page mapped to NWH Childbirth Education", "Childbirth education landing page mapped to MGB/NWH childbirth education page.", 0.95);
    }
    return human(MGB_DESTINATIONS.childbirthEducation, "Childbirth class / workshop requires HUMAN CHECK", "Childbirth classes and workshops should be reviewed; suggested destination is NWH Childbirth Education.", 0.25);
  }

  if (isLactationOrBreastfeedingSource(row)) {
    return human(MGB_DESTINATIONS.obgynConcept, "Lactation / breastfeeding content requires HUMAN CHECK", "Lactation, breastfeeding, newborn feeding, and breast-pump content should not be mapped to Cancer. Review against maternity/OB-GYN resources.", 0.25);
  }

  if (isPlanningVisitResource(row)) {
    return redirect(MGB_DESTINATIONS.planningVisit, "Planning-your-visit resource mapped to Planning Your Visit", "Hotel, transportation, phone, Wi-Fi, and pre-registration resources mapped to the Planning Your Visit parent instead of Visitor Policy.", 0.86);
  }

  if (isPatientServiceResource(row)) {
    return redirect(MGB_DESTINATIONS.patientVisitor, "Patient service resource mapped to Patient & Visitor Information", "Interpreter, veterans, and patient service resources mapped to Patient & Visitor Information instead of Visitor Policy.", 0.84);
  }

  if (isPsychiatryPath(row)) {
    return redirect(MGB_DESTINATIONS.mentalHealth, "Psychiatry/behavioral health mapped to Mental Health Psychiatry", "Psychiatry, behavioral health, and substance-use URLs mapped to MGB Mental Health Psychiatry, not Emergency.", 0.9);
  }

  if (isHeartburnGerdSource(row)) {
    return redirect(MGB_DESTINATIONS.gastroenterology, "Heartburn/GERD content mapped to Gastroenterology", "Heartburn, GERD, and reflux content mapped to Gastroenterology rather than Heart.", 0.9);
  }

  if (isSportsMedicinePath(row)) {
    return redirect(MGB_DESTINATIONS.sportsMedicine, "Sports medicine mapped to MGB Sports Medicine", "Sports medicine and sport-medicine URLs mapped to MGB Sports Medicine.", 0.9);
  }

  if (isWomensHealthSource(row)) {
    return redirect(MGB_DESTINATIONS.obgynConcept, "Women's health / gynecology mapped to OB/GYN concept", "Women's health, gynecologic surgery, fertility/infertility, pelvic pain, endometriosis, and hysterectomy content mapped to OB/GYN concept instead of broad Services/location.", 0.86);
  }

  if (isPediatricsSource(row)) {
    if (isPediatricEmergencySource(row)) {
      return redirect(MGB_DESTINATIONS.emergency, "Pediatric emergency page mapped to Emergency", "Pediatric emergency-room content mapped to Emergency.", 0.86);
    }
    return redirect(MGB_DESTINATIONS.pediatrics, "Pediatric content mapped to Pediatrics", "Pediatric and MassGeneral for Children content mapped to MGB Pediatrics.", 0.88);
  }

  return decideMappingBeforePatch(row, destinationCandidates);
};

const categoryFallbackBeforePatch = categoryFallback;
categoryFallback = function patchedCategoryFallback(row, destinationCandidates) {
  if (isGiftPlanningHost(row)) return null;
  if (isGivingHost(row)) {
    return route(MGB_DESTINATIONS.giving, "Giving host mapped to NWH Giving", "giving.nwh.org URLs mapped to NWH Giving.", 0.9);
  }
  if (isCareerSource(row)) return route(MGB_DESTINATIONS.careers, "Career URL mapped to MGB Careers", "Careers URLs mapped to MGB Careers.", 0.9);
  if (isMedicalEducationSource(row)) {
    return route(
      MGB_DESTINATIONS.educationTraining,
      "Medical education mapped to MGB Education and Training",
      "Medical education, physician education, and professional training content mapped to MGB Education and Training.",
      0.9
    );
  }
  if (isPsychiatryPath(row)) return route(MGB_DESTINATIONS.mentalHealth, "Psychiatry/behavioral health mapped to Mental Health Psychiatry", "Psychiatry, behavioral health, and substance-use URLs mapped to MGB Mental Health Psychiatry.", 0.9);
  if (isHeartburnGerdSource(row)) return route(MGB_DESTINATIONS.gastroenterology, "Heartburn/GERD content mapped to Gastroenterology", "Heartburn, GERD, and reflux content mapped to Gastroenterology.", 0.9);
  if (isSportsMedicinePath(row)) return route(MGB_DESTINATIONS.sportsMedicine, "Sports medicine mapped to MGB Sports Medicine", "Sports medicine URLs mapped to MGB Sports Medicine.", 0.9);
  if (isWomensHealthSource(row)) return route(MGB_DESTINATIONS.obgynConcept, "Women's health / gynecology mapped to OB/GYN concept", "Women's health and gynecology content mapped to OB/GYN concept.", 0.86);
  return categoryFallbackBeforePatch(row, destinationCandidates);
};
