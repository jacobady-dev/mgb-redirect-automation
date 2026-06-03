// Deep-research specificity layer.
// Loaded after rules-patch.js. This layer favors same-family, live-validated,
// intent-specific redirects over broad fuzzy/category fallbacks.

// Live/current destination overrides from the NWH↔MGB specificity pass.
MGB_DESTINATIONS.providers = "https://doctors.massgeneralbrigham.org/";
MGB_DESTINATIONS.giving = "https://www.massgeneralbrigham.org/en/about/giving";
MGB_DESTINATIONS.medicalProfessionals = "https://www.massgeneralbrigham.org/en/medical-professionals";
MGB_DESTINATIONS.educationTraining = "https://www.massgeneralbrigham.org/en/education-and-training";
MGB_DESTINATIONS.mentalHealth = "https://www.massgeneralbrigham.org/en/about/complex-psychiatric-care";
MGB_DESTINATIONS.hipaa = "https://www.massgeneralbrigham.org/en/notices/hipaa";
MGB_DESTINATIONS.patientRights = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/patient-rights";
MGB_DESTINATIONS.preventiveBilling = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing/preventive-health";
MGB_DESTINATIONS.outpatientBilling = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing/physician-office-and-outpatient-billing";
MGB_DESTINATIONS.billingInsurance = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/billing/insurance";
MGB_DESTINATIONS.accessibility = "https://www.massgeneralbrigham.org/en/about/accessibility";
MGB_DESTINATIONS.childbirthEducation = "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information/newton-wellesley-childbirth-education";
MGB_DESTINATIONS.homeHospital = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/healthcare-at-home/home-hospital";
MGB_DESTINATIONS.healthcareAtHome = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/healthcare-at-home";
MGB_DESTINATIONS.nwhImaging = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/mass-general-brigham-imaging-newton-wellesley-hospital";
MGB_DESTINATIONS.mvhImaging = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/mass-general-brigham-imaging-marthas-vineyard-hospital";
MGB_DESTINATIONS.nchImaging = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/mass-general-brigham-imaging-nantucket-cottage-hospital";
MGB_DESTINATIONS.cdhImaging = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/mass-general-brigham-imaging-cooley-dickinson-hospital1";
MGB_DESTINATIONS.salemImaging = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/mass-general-brigham-imaging-salem-hospital";
MGB_DESTINATIONS.nwhEndocrinology = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/mass-general-brigham-newton-endocrinology";
MGB_DESTINATIONS.substanceUse = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/substance-use-disorder-bridge-clinics";
MGB_DESTINATIONS.vascular = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/heart/vascular";
MGB_DESTINATIONS.colorectalScreening = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/cancer/colorectal-cancer-screening";
MGB_DESTINATIONS.infertilityLocation = "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/locations/brigham-and-womens-center-for-infertility-reproductive-surgery";

function drText(row) { return textForRow(row); }
function drPath(row) { return pathForRow(row); }
function drHost(row) { return hostForRow(row); }
function drUrl(row) { return String(row.sourceUrl || "").toLowerCase(); }

function drHasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function drStatusIsError(row) {
  const status = String(row.statusCode || row["Status Code"] || "").trim();
  return /^4\d\d/.test(status) || /^5\d\d/.test(status);
}

function drIsProviderSearchOrProfile(row) {
  const path = drPath(row);
  return path.includes("/find-a-doctor/find-a-doctor-profile") ||
    path.includes("/find-a-doctor/find-a-doctor-home") ||
    path.includes("/all-providers") ||
    path === "/providers";
}

function drIsOpaqueQueryOrCode(row) {
  const url = drUrl(row);
  if (url.includes("contentpage.aspx")) return true;
  if (url.includes("/docs/details")) return true;
  if (/[?&]return_url=/.test(url)) return true;
  if (/[?&]nd=\d+/.test(url) && /[?&]id=\d+/.test(url)) return true;
  return false;
}

function drIsGivingHost(row) {
  const host = drHost(row);
  return host === "giving.nwh.org" || host === "giftplanning.nwh.org";
}

function drIsGiftShopOrDevelopment(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("gift-shop") || path.includes("development-office") || text.includes("gift shop") || text.includes("development office");
}

function drIsCareer(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/careers") || text.includes("career") || text.includes("employment") || text.includes("workforce development");
}

function drIsMedicalProfessionalAudience(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("for-medical-professionals") ||
    path.includes("for-physicians") ||
    path.includes("for-medical-staff") ||
    path.includes("referring-patient") ||
    text.includes("for medical professionals") ||
    text.includes("for physicians") ||
    text.includes("for medical staff") ||
    text.includes("referring patient");
}

function drIsGeneralMedicalEducation(row) {
  const path = drPath(row);
  const text = drText(row);
  return path.includes("/medical-education/") || text.includes("medical education") || text.includes("residents") || text.includes("nursing education") || text.includes("simulation center");
}

function drIsPrivacy(row) {
  const path = drPath(row);
  const text = drText(row);
  return path.includes("privacy-policy") || text.includes("web privacy policy") || text.includes("privacy policy");
}

function drIsHipaa(row) {
  const text = drText(row);
  return text.includes("hipaa");
}

function drIsPatientRights(row) {
  const path = drPath(row);
  const text = drText(row);
  return path.includes("patient-rights-responsibilities") || path.includes("your-rights-patient") || text.includes("patient rights and responsibilities");
}

function drIsLegalReview(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("legal-statements") || path.includes("nondiscrimination") || text.includes("legal statements") || text.includes("nondiscrimination");
}

function drIsCmsChargeData(row) {
  const text = drText(row);
  return text.includes("cms-required-hospital-charge-data") || text.includes("cms required hospital charge data") || text.includes("charge data");
}

function drIsBilling(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/billing-and-records/") || text.includes("billing") || text.includes("insurance") || text.includes("financial assistance");
}

function drBillingDecision(row) {
  const text = drText(row);
  if (drIsCmsChargeData(row)) return redirect(MGB_DESTINATIONS.cmsChargeData, "Exact CMS charge data mapping", "CMS-required hospital charge data mapped to the exact MGB charge-data page.", 0.98);
  if (text.includes("preventive-health-exam") || text.includes("preventive health exam")) return redirect(MGB_DESTINATIONS.preventiveBilling, "Preventive-health billing mapping", "Preventive-health exam billing mapped to the MGB preventive-health billing page.", 0.95);
  if (text.includes("outpatient-billing") || text.includes("physician office") || text.includes("hospital outpatient")) return redirect(MGB_DESTINATIONS.outpatientBilling, "Outpatient billing mapping", "Physician office / hospital outpatient billing mapped to the exact MGB outpatient billing page.", 0.92);
  if (text.includes("financial assistance") || text.includes("help with financial questions")) return redirect(MGB_DESTINATIONS.financialAssistance, "Financial assistance mapping", "Financial-assistance billing content mapped to MGB Financial Assistance.", 0.92);
  if (text.includes("insurance")) return redirect(MGB_DESTINATIONS.billingInsurance, "Insurance billing mapping", "Insurance/billing content mapped to MGB Insurances Accepted.", 0.9);
  return redirect(MGB_DESTINATIONS.billing, "Billing mapping", "Billing records and billing help mapped to MGB Billing.", 0.9);
}

function drIsPressArchive(row) {
  const path = drPath(row);
  const text = drText(row);
  return path.includes("/in-the-news") || path.includes("/public-notice") || path.includes("/media-inquiries") || text.includes("press release") || text.includes("public notice") || text.includes("media inquiries");
}

function drIsPressLanding(row) {
  const path = drPath(row);
  return path === "/about-us/press-room/press-room" || path === "/about-us/press-room" || path === "/about-us/press-room/";
}

function drIsStoryOrTestimonial(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("patient-testimonials") || path.includes("patient-testimonial") || path.includes("patient-success-stories") || path.includes("success-stories") || path.includes("patient-reviews") || /\/[a-z0-9-]+s-story(\/|$)/.test(path) || text.includes("patient testimonials") || text.includes("success stories") || text.includes("patient reviews");
}

function drIsFormOrUtility(row) {
  const path = drPath(row);
  return path.includes("thank-you") || path.includes("rsvp") || path.includes("registration") || path.includes("contact-form") || path.includes("request-a-virtual-appointment") || path.includes("opt-in-form");
}

function drIsChildbirthEducation(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/maternity/childbirth-education") || text.includes("childbirth education") || text.includes("cesarean birth class") || text.includes("spinning babies") || text.includes("natural childbirth") || text.includes("infant care");
}

function drIsLactation(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("lactationbreastfeeding") || text.includes("lactation") || text.includes("breastfeeding") || text.includes("newborn feeding") || text.includes("breast milk") || text.includes("breast pump");
}

function drIsMaternityFamily(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/maternity/") || path.includes("/obstetrics-and-gynecology/") || text.includes("maternity") || text.includes("postpartum") || text.includes("labor delivery") || text.includes("cesarean") || text.includes("obstetrics") || text.includes("pregnancy");
}

function drImagingDestinationForSource(row) {
  const host = drHost(row);
  const text = drText(row);
  if (host.includes("mvhospital") || text.includes("martha's vineyard") || text.includes("marthas vineyard")) return MGB_DESTINATIONS.mvhImaging;
  if (host.includes("nantucket") || text.includes("nantucket cottage")) return MGB_DESTINATIONS.nchImaging;
  if (host.includes("cooley") || text.includes("cooley dickinson")) return MGB_DESTINATIONS.cdhImaging;
  if (host.includes("salem") || text.includes("salem hospital")) return MGB_DESTINATIONS.salemImaging;
  return MGB_DESTINATIONS.nwhImaging;
}

function drIsRadiologyOrImaging(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/radiology/") || path === "/radiology" || path.includes("/womens-imaging-center/") || path === "/womens-imaging-center" || drHasAny(text, ["radiology", "imaging", "mri", "ct scan", "pet scan", "ultrasound", "x-ray", "fluoroscopy", "nuclear medicine", "mammogram", "tomosynthesis", "arthrogram"]);
}

function drRadiologyDecision(row) {
  const text = drText(row);
  if (text.includes("lung cancer screening") || (text.includes("low-dose ct") && text.includes("lung")) || (text.includes("low dose ct") && text.includes("lung"))) {
    return redirect(MGB_DESTINATIONS.lungCancerScreening, "Radiology lung screening mapped to Lung Cancer Screening", "Low-dose CT and lung cancer screening radiology pages mapped to the exact MGB lung cancer screening page.", 0.96);
  }
  if (drIsMedicalProfessionalAudience(row)) {
    return redirect(MGB_DESTINATIONS.medicalProfessionals, "Radiology professional page mapped to Medical Professionals", "Radiology/MRI for-physicians content mapped to MGB Medical Professionals.", 0.92);
  }
  return redirect(drImagingDestinationForSource(row), "Radiology/imaging mapped to hospital imaging location", "Radiology, MRI, CT, ultrasound, nuclear medicine, PET/CT, X-ray, fluoroscopy, mammogram, and women's imaging pages are kept in the imaging family instead of broad services/cancer/orthopedics.", 0.92);
}

function drIsCancerFamily(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/mass-general-cancer-center/") || path.includes("/vernon-cancer-center/") || path.includes("/auerbach-breast-center/") || text.includes("cancer center") || text.includes("oncology") || text.includes("breast center");
}

function drCancerDecision(row) {
  const text = drText(row);
  if (text.includes("lung cancer screening") || (text.includes("low-dose ct") && text.includes("lung")) || (text.includes("low dose ct") && text.includes("lung"))) {
    return redirect(MGB_DESTINATIONS.lungCancerScreening, "Lung cancer screening mapped to exact MGB page", "Lung cancer screening and low-dose CT screening content mapped to MGB Lung Cancer Screening.", 0.96);
  }
  if (text.includes("colorectal") && text.includes("screen")) {
    return redirect(MGB_DESTINATIONS.colorectalScreening, "Colorectal cancer screening mapped to exact MGB page", "Colorectal screening content mapped to MGB Colorectal Cancer Screening.", 0.95);
  }
  return redirect(MGB_DESTINATIONS.cancer, "Cancer content mapped to MGB Cancer Institute", "Cancer center, oncology, Auerbach Breast Center, and cancer patient-resource pages mapped to MGB Cancer Institute unless a more exact cancer-screening page exists.", 0.9);
}

function drIsPsychiatry(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/psychiatry") || path.includes("/substance-use") || text.includes("psychiatry") || text.includes("behavioral health") || text.includes("mental health") || text.includes("substance use");
}

function drPsychiatryDecision(row) {
  const text = drText(row);
  const path = drPath(row);
  if (path.includes("substance-use") || text.includes("substance use")) {
    return redirect(MGB_DESTINATIONS.substanceUse, "Substance-use page mapped to MGB Bridge Clinics", "Substance-use pages mapped to the MGB Substance Use Disorder Bridge Clinics page.", 0.9);
  }
  return redirect(MGB_DESTINATIONS.mentalHealth, "Psychiatry mapped to Complex Psychiatric Care", "Psychiatry, child/adolescent psychiatry, behavioral health, and medical psychiatry pages mapped to the MGB complex psychiatric care umbrella instead of Emergency.", 0.9);
}

function drIsHeartburnGerd(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("heartburn-center") || text.includes("heartburn") || text.includes("gerd") || text.includes("reflux");
}

function drIsSportsMedicine(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("sports-medicine") || path.includes("sport-medicine") || text.includes("sports medicine") || text.includes("sport medicine");
}

function drIsWomenHealth(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("womens-health-center") || path.includes("center-for-minimally-invasive-gynecologic-surgery") || text.includes("gynecologic") || text.includes("gynecology") || text.includes("pelvic pain") || text.includes("endometriosis") || text.includes("adenomyosis") || text.includes("hysterectomy") || text.includes("hysteroscopy") || text.includes("laparoscopy") || text.includes("infertility") || text.includes("fertility") || text.includes("reproductive medicine");
}

function drWomenHealthDecision(row) {
  const text = drText(row);
  if (text.includes("infertility") || text.includes("fertility") || text.includes("reproductive medicine")) {
    return human(MGB_DESTINATIONS.infertilityLocation, "Reproductive medicine / infertility requires HUMAN CHECK", "Reproductive medicine and infertility content has a more specific MGB location candidate, but should be reviewed before force-mapping.", 0.45);
  }
  return redirect(MGB_DESTINATIONS.obgynConcept, "Women's health / gynecology mapped to OB/GYN", "Women's health, gynecologic surgery, pelvic pain, endometriosis, adenomyosis, hysterectomy, hysteroscopy, and laparoscopy content mapped to the OB/GYN care concept.", 0.88);
}

function drIsPediatrics(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/pediatrics") || text.includes("pediatric") || text.includes("massgeneral for children");
}

function drPediatricsDecision(row) {
  const text = drText(row);
  if (text.includes("emergency room") || text.includes("pediatric emergency")) {
    return redirect(MGB_DESTINATIONS.emergency, "Pediatric emergency mapped to Emergency", "Pediatric emergency-room content mapped to Emergency Care.", 0.86);
  }
  return human(MGB_DESTINATIONS.providers, "Pediatrics requires HUMAN CHECK", "General pediatric and MassGeneral for Children at NWH pages do not have a sufficiently verified system-level equivalent in the MGB reference. Review before redirecting.", 0.35);
}

function drIsLocation(row) {
  const path = drPath(row);
  const text = drText(row);
  return path.includes("/locations/") || text.includes("maxwell blum pavilion") || text.includes("directions") || text.includes("parking");
}

function drLocationDecision(row, destinationCandidates) {
  const best = findBestCandidate(row, destinationCandidates);
  if (best && best.score >= 0.86 && destinationLooksLikeLocation(best.destinationUrl, best.text)) {
    return redirect(best.destinationUrl, "Strong exact location match", "Location page mapped only because a strong same-family MGB location candidate was found.", best.score);
  }
  return human(hospitalProfileForSource(row) || MGB_DESTINATIONS.nwhLocation, "Location/building page requires HUMAN CHECK", "Building, directions, parking, and location pages should not be force-mapped to a clinical service without an exact/strong MGB location.", best?.score || 0.25);
}

function drIsHomeHospital(row) {
  const text = drText(row);
  return text.includes("home hospital") || text.includes("mass-general-brigham-home-hospital");
}

function drIsNeurologySource(row) {
  const text = drText(row);
  return text.includes("multiple sclerosis") || text.includes("primary stroke") || text.includes("stroke warning") || text.includes("neurology");
}

function drIsVascularSource(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("vascular-surgery") || text.includes("vascular surgery") || text.includes("vascular medicine");
}

function drIsColorectalSource(row) {
  const text = drText(row);
  return text.includes("colorectal") || text.includes("colon and rectal") || text.includes("colon cancer") || text.includes("rectal cancer");
}

function drIsGeneralSurgerySource(row) {
  const text = drText(row);
  const path = drPath(row);
  return path.includes("/surgery/") || path.includes("/robotic-surgery/") || path.includes("/pre-surgery-information") || text.includes("pre-surgery") || text.includes("surgical discharge instructions") || text.includes("robotic surgery");
}

function drGeneralSurgeryDecision(row) {
  const text = drText(row);
  if (text.includes("bariatric") || text.includes("weight loss")) return redirect(MGB_DESTINATIONS.bariatric, "Bariatric surgery mapped to Weight Loss Surgery", "Bariatric/weight-loss surgery content mapped to MGB Weight Loss Surgery.", 0.9);
  if (text.includes("gynecologic") || text.includes("hysterectomy")) return redirect(MGB_DESTINATIONS.obgynConcept, "Gynecologic surgery mapped to OB/GYN", "Gynecologic robotic/surgical content mapped to the OB/GYN care concept.", 0.86);
  if (text.includes("colorectal") || text.includes("colon")) return human(MGB_DESTINATIONS.colorectalScreening, "Colorectal surgery requires HUMAN CHECK", "Colorectal surgery/procedure pages should be reviewed; MGB has a colorectal screening page but not all surgery content is screening intent.", 0.4);
  if (text.includes("thoracic")) return human("", "Thoracic surgery requires HUMAN CHECK", "Thoracic surgery pages lack a clearly approved system-level MGB target in the current reference.", 0.3);
  return human(MGB_DESTINATIONS.patientVisitor, "General surgery / pre-surgery page requires HUMAN CHECK", "Pre-surgery, surgical discharge, robotic surgery, and general procedure pages are too broad for the Services parent. Review manually.", 0.35);
}

function drIsHumanReviewContentType(row) {
  const text = drText(row);
  return drIsStoryOrTestimonial(row) || drIsFormOrUtility(row) || text.includes("support group") || text.includes("workshop") || text.includes("seminar") || text.includes("class registration") || text.includes("patient handouts") || text.includes("recommended books") || text.includes("helpful links");
}

function drGenericParentTooVague(decision, row) {
  if (!decision || decision.bucket !== "redirect") return false;
  const dest = String(decision.destinationUrl || "").replace(/\/$/, "");
  const path = drPath(row);
  const text = drText(row);
  const broadServices = dest === MGB_DESTINATIONS.services.replace(/\/$/, "");
  const broadPatientVisitor = dest === MGB_DESTINATIONS.patientVisitor.replace(/\/$/, "");
  if (broadServices && (path.includes("/medical-services/") || path.includes("/surgery/") || path.includes("/robotic-surgery/") || text.includes("procedure") || text.includes("treatment"))) return true;
  if (broadPatientVisitor && (path.includes("/medical-services/") || path.includes("/surgery/") || path.includes("/vascular-surgery") || path.includes("/thoracic-surgery"))) return true;
  return false;
}

const decideMappingBeforeDeepResearch = decideMapping;
decideMapping = function deepResearchDecideMapping(row, destinationCandidates) {
  if (drStatusIsError(row)) {
    return human("", "Source returned 4xx/5xx; HUMAN CHECK", "Broken HTML source rows are quarantined so the tool does not invent mappings from low-signal content.", 0.1);
  }

  if (drIsProviderSearchOrProfile(row)) {
    return redirect(MGB_DESTINATIONS.providers, "Provider URL mapped to live provider directory", "Find-a-doctor profile and doctor-search URLs mapped to the live MGB provider directory.", 0.95);
  }

  if (drIsOpaqueQueryOrCode(row)) {
    return human(MGB_DESTINATIONS.providers, "Code-looking/query URL requires HUMAN CHECK", "ContentPage.aspx, docs/details, return_url, and dense ID query URLs should be reviewed manually rather than force-mapped.", 0.2);
  }

  if (drIsGivingHost(row)) {
    return redirect(MGB_DESTINATIONS.giving, "Giving/giftplanning host mapped to live MGB Giving", "giving.nwh.org and giftplanning.nwh.org are host-level giving intents and map to the live MGB Giving page.", 0.95);
  }

  if (drIsGiftShopOrDevelopment(row)) {
    return human(MGB_DESTINATIONS.giving, "Gift shop/development office requires HUMAN CHECK", "Gift shop and development-office pages should be reviewed before mapping to a giving destination.", 0.3);
  }

  if (drIsCareer(row)) {
    return redirect(MGB_DESTINATIONS.careers, "Career URL mapped to MGB Careers", "Careers, workforce-development, employment, and careers-for-physicians pages mapped to MGB Careers before education rules run.", 0.92);
  }

  if (drIsMedicalProfessionalAudience(row)) {
    return redirect(MGB_DESTINATIONS.medicalProfessionals, "Medical-professional audience mapped to Medical Professionals", "For-physicians, for-medical-professionals, for-medical-staff, and referring-provider pages mapped to MGB Medical Professionals.", 0.95);
  }

  if (drIsGeneralMedicalEducation(row)) {
    return redirect(MGB_DESTINATIONS.educationTraining, "Medical education mapped to Education and Training", "General medical education, nursing education, resident, and simulation-center pages mapped to MGB Education and Training.", 0.9);
  }

  if (drIsPrivacy(row)) return redirect(MGB_DESTINATIONS.webPrivacyPolicy, "Privacy policy mapped to Web Privacy Policy", "Privacy-policy content mapped to the exact MGB Web Privacy Policy.", 0.98);
  if (drIsHipaa(row)) return redirect(MGB_DESTINATIONS.hipaa, "HIPAA mapped to MGB HIPAA notice", "HIPAA content mapped to the exact MGB HIPAA notice.", 0.98);
  if (drIsPatientRights(row)) return redirect(MGB_DESTINATIONS.patientRights, "Patient rights mapped to Patient Rights", "Patient rights and responsibilities content mapped to the exact MGB Patient Rights page.", 0.98);
  if (drIsLegalReview(row)) return human(MGB_DESTINATIONS.notices, "Legal/nondiscrimination notice requires HUMAN CHECK", "Legal statements and nondiscrimination notices should be reviewed against the Notices family instead of visitor policy.", 0.35);
  if (drIsBilling(row)) return drBillingDecision(row);

  if (drIsPressLanding(row)) return redirect(hospitalProfileForSource(row) || MGB_DESTINATIONS.nwhLocation, "Press landing mapped to hospital profile", "Press-room landing pages are hospital/about intent and map to the matching hospital profile rather than a service page.", 0.82);
  if (drIsPressArchive(row)) return human(hospitalProfileForSource(row) || "", "Press/news/archive content requires HUMAN CHECK", "In-the-news, public-notice, media-inquiry, and press-release-like content should not be force-mapped without review.", 0.25);
  if (drIsStoryOrTestimonial(row)) return human("", "Story/testimonial/review requires HUMAN CHECK", "Patient stories, success stories, testimonials, and reviews should not be force-mapped to service parents.", 0.25);
  if (drIsFormOrUtility(row)) return human("", "Form/thank-you/registration URL requires HUMAN CHECK", "Form, RSVP, registration, opt-in, request, and thank-you URLs should be reviewed before redirecting.", 0.25);

  if (drIsChildbirthEducation(row) || drIsLactation(row)) {
    return redirect(MGB_DESTINATIONS.childbirthEducation, "Childbirth/lactation mapped to NWH Childbirth Education", "Childbirth education, breastfeeding, lactation, newborn feeding, infant care, cesarean-birth class, and breast-pump pages mapped to the exact NWH Childbirth Education page, not Cancer.", 0.96);
  }

  if (drIsCancerFamily(row)) return drCancerDecision(row);
  if (drIsRadiologyOrImaging(row)) return drRadiologyDecision(row);
  if (drIsPsychiatry(row)) return drPsychiatryDecision(row);
  if (drIsHeartburnGerd(row)) return human(MGB_DESTINATIONS.gastroenterology, "Heartburn/GERD requires HUMAN CHECK", "Heartburn, GERD, and reflux pages should not map to Heart/Cardiology. Review against gastroenterology/esophageal-care options.", 0.4);
  if (drIsSportsMedicine(row)) return redirect(MGB_DESTINATIONS.sportsMedicine, "Sports medicine mapped to MGB Sports Medicine", "Sports medicine and sport-medicine URLs mapped to MGB Sports Medicine.", 0.93);
  if (drIsWomenHealth(row)) return drWomenHealthDecision(row);
  if (drIsMaternityFamily(row)) return redirect(MGB_DESTINATIONS.obgynConcept, "Maternity/OB-GYN mapped to OB/GYN care", "Maternity, postpartum, labor/delivery, obstetrics, and pregnancy pages mapped to the OB/GYN care concept unless childbirth-education/lactation rules already matched.", 0.88);
  if (drIsPediatrics(row)) return drPediatricsDecision(row);
  if (drIsLocation(row)) return drLocationDecision(row, destinationCandidates);
  if (drIsHomeHospital(row)) return redirect(MGB_DESTINATIONS.homeHospital, "Home Hospital mapped to exact Home Hospital page", "Mass General Brigham Home Hospital pages mapped to the exact MGB Home Hospital destination.", 0.95);
  if (drIsNeurologySource(row)) return redirect(MGB_DESTINATIONS.neurology, "Stroke/MS/neurology mapped to Neurology", "Primary stroke, multiple sclerosis, and neurology pages mapped to MGB Neurology.", 0.88);
  if (drIsVascularSource(row)) return redirect(MGB_DESTINATIONS.vascular, "Vascular surgery mapped to Heart/Vascular", "Vascular surgery and vascular medicine pages mapped to MGB Heart/Vascular instead of broad Services.", 0.88);
  if (drIsColorectalSource(row)) {
    const text = drText(row);
    if (text.includes("screen")) return redirect(MGB_DESTINATIONS.colorectalScreening, "Colorectal screening mapped to exact MGB page", "Colorectal screening content mapped to MGB Colorectal Cancer Screening.", 0.92);
    return human(MGB_DESTINATIONS.colorectalScreening, "Colorectal surgery requires HUMAN CHECK", "Colorectal surgery/procedure content is not necessarily screening intent; review before redirecting.", 0.4);
  }
  if (drIsGeneralSurgerySource(row)) return drGeneralSurgeryDecision(row);
  if (drIsHumanReviewContentType(row)) return human("", "Event/resource/editorial content requires HUMAN CHECK", "Support groups, workshops, seminars, patient handouts, recommended books, and helpful-links pages should be reviewed before redirecting.", 0.25);

  const decision = decideMappingBeforeDeepResearch(row, destinationCandidates);
  if (drGenericParentTooVague(decision, row)) {
    return human(decision.destinationUrl, "Broad parent fallback requires HUMAN CHECK", "The only available automated destination was a broad parent page. Review for a more specific destination before putting this in the CSV.", decision.score || 0.35);
  }
  return decision;
};

const categoryFallbackBeforeDeepResearch = categoryFallback;
categoryFallback = function deepResearchCategoryFallback(row, destinationCandidates) {
  if (drIsCareer(row)) return route(MGB_DESTINATIONS.careers, "Career URL mapped to MGB Careers", "Careers URLs mapped to MGB Careers.", 0.92);
  if (drIsMedicalProfessionalAudience(row)) return route(MGB_DESTINATIONS.medicalProfessionals, "Medical-professional audience mapped to Medical Professionals", "For-physicians/professional pages mapped to MGB Medical Professionals.", 0.95);
  if (drIsGeneralMedicalEducation(row)) return route(MGB_DESTINATIONS.educationTraining, "Medical education mapped to Education and Training", "General medical education pages mapped to MGB Education and Training.", 0.9);
  if (drIsRadiologyOrImaging(row)) return route(drImagingDestinationForSource(row), "Radiology/imaging mapped to hospital imaging location", "Radiology/imaging family restricted to imaging location fallback.", 0.9);
  if (drIsPsychiatry(row)) return route(MGB_DESTINATIONS.mentalHealth, "Psychiatry mapped to Complex Psychiatric Care", "Psychiatry family restricted to complex psychiatric care fallback.", 0.9);
  if (drIsSportsMedicine(row)) return route(MGB_DESTINATIONS.sportsMedicine, "Sports medicine mapped to MGB Sports Medicine", "Sports medicine family restricted to sports medicine fallback.", 0.9);
  if (drIsWomenHealth(row)) return route(MGB_DESTINATIONS.obgynConcept, "Women's health mapped to OB/GYN", "Women’s health family restricted to OB/GYN fallback.", 0.86);
  return categoryFallbackBeforeDeepResearch(row, destinationCandidates);
};
