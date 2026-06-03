// IA source-of-truth tuning layer.
// Loaded after deep/final tuning and before output-format.js.
// Uses the current MGB IA workbook Full URL values as the preferred destination set.

const IA_DESTINATIONS = {
  providers: "https://www.massgeneralbrigham.org/en/providers",
  locations: "https://www.massgeneralbrigham.org/en/locations",

  services: "https://www.massgeneralbrigham.org/en/services",
  patientVisitor: "https://www.massgeneralbrigham.org/en/patients-visitors",
  visitorInformation: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information",
  planningVisit: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/plan-visit",
  visitorPolicy: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/plan-visit/policy",
  directionsParking: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/plan-visit/directions-parking",
  accommodations: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/plan-visit/accommodations",
  shuttles: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/plan-visit/shuttles",
  wifiCharging: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/plan-visit/wifi-charging-access",
  hospitalAmenities: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/hospital-amenities",
  retailShops: "https://www.massgeneralbrigham.org/en/patients-visitors/visitor-information/hospital-amenities/retail-shops",

  billingInsurance: "https://www.massgeneralbrigham.org/en/patients-visitors/billing-insurance",
  billing: "https://www.massgeneralbrigham.org/en/patients-visitors/billing-insurance/billing",
  cmsChargeData: "https://www.massgeneralbrigham.org/en/patients-visitors/billing-insurance/billing/cms-required-hospital-charge-data",
  preventiveBilling: "https://www.massgeneralbrigham.org/en/patients-visitors/billing-insurance/billing/preventive-health-exam",
  outpatientBilling: "https://www.massgeneralbrigham.org/en/patients-visitors/billing-insurance/billing/physician-office-hospital-outpatient",
  financialAssistance: "https://www.massgeneralbrigham.org/en/patients-visitors/billing-insurance/billing/financial-assistance",
  medicalRecords: "https://www.massgeneralbrigham.org/en/patients-visitors/resources/becoming-patient/medical-records",
  patientGateway: "https://www.massgeneralbrigham.org/en/patients-visitors/resources/becoming-patient/patient-gateway",
  patientRights: "https://www.massgeneralbrigham.org/en/patients-visitors/resources/patient-experience/rights-responsibilities",

  notices: "https://www.massgeneralbrigham.org/en/notices",
  hipaa: "https://www.massgeneralbrigham.org/en/notices/hipaa",
  webPrivacyPolicy: "https://www.massgeneralbrigham.org/en/notices/web-privacy-policy",

  medicalProfessionals: "https://www.massgeneralbrigham.org/en/medical-professionals",
  educationTraining: "https://www.massgeneralbrigham.org/en/education",
  careers: "https://www.massgeneralbrigham.org/en/about/careers",
  giving: "https://www.massgeneralbrigham.org/en/about/giving",

  nwhAbout: "https://www.massgeneralbrigham.org/en/about/newton-wellesley-hospital",
  cooleyAbout: "https://www.massgeneralbrigham.org/en/about/cooley-dickinson-hospital",
  mvhAbout: "https://www.massgeneralbrigham.org/en/about/marthas-vineyard-hospital",
  nchAbout: "https://www.massgeneralbrigham.org/en/about/nantucket-cottage-hospital",
  salemAbout: "https://www.massgeneralbrigham.org/en/about/salem-hospital",

  nwhGiving: "https://www.massgeneralbrigham.org/en/about/newton-wellesley-hospital/giving",
  cooleyGiving: "https://www.massgeneralbrigham.org/en/about/cooley-dickinson-hospital/giving",
  mvhGiving: "https://www.massgeneralbrigham.org/en/about/marthas-vineyard-hospital/giving",
  nchGiving: "https://www.massgeneralbrigham.org/en/about/nantucket-cottage-hospital/giving",
  salemGiving: "https://www.massgeneralbrigham.org/en/about/salem-hospital/giving",

  imaging: "https://www.massgeneralbrigham.org/en/services/imaging",
  diabetes: "https://www.massgeneralbrigham.org/en/services/diabetes",
  diabetesPregnancy: "https://www.massgeneralbrigham.org/en/services/diabetes-pregnancy",
  endocrinology: "https://www.massgeneralbrigham.org/en/services/endocrinology",
  orthopedics: "https://www.massgeneralbrigham.org/en/services/orthopedics",
  spine: "https://www.massgeneralbrigham.org/en/services/spine",
  sportsMedicine: "https://www.massgeneralbrigham.org/en/services/sports-medicine",
  physicalMedicineRehab: "https://www.massgeneralbrigham.org/en/services/physical-medicine-rehabilitation",
  physicalTherapy: "https://www.massgeneralbrigham.org/en/services/physical-therapy",
  occupationalTherapy: "https://www.massgeneralbrigham.org/en/services/occupational-therapy",
  cancer: "https://www.massgeneralbrigham.org/en/services/cancer",
  lungCancer: "https://www.massgeneralbrigham.org/en/services/lung-cancer",
  colorectalCancer: "https://www.massgeneralbrigham.org/en/services/colorectal-cancer",
  colorectalSurgery: "https://www.massgeneralbrigham.org/en/services/colorectal-surgery",
  obgyn: "https://www.massgeneralbrigham.org/en/services/obstetrics-gynecology",
  lactationSupport: "https://www.massgeneralbrigham.org/en/services/lactation-support",
  painManagement: "https://www.massgeneralbrigham.org/en/services/pain-management",
  mentalHealth: "https://www.massgeneralbrigham.org/en/services/mental-health-psychiatry",
  substanceUse: "https://www.massgeneralbrigham.org/en/services/bridge-clinic",
  sleep: "https://www.massgeneralbrigham.org/en/services/sleep",
  children: "https://www.massgeneralbrigham.org/en/services/children",
  pediatricPrimaryCare: "https://www.massgeneralbrigham.org/en/services/pediatric-primary-care",
  primaryCare: "https://www.massgeneralbrigham.org/en/services/primary-care",
  emergency: "https://www.massgeneralbrigham.org/en/services/emergency-medicine",
  gastroenterology: "https://www.massgeneralbrigham.org/en/services/gastroenterology",
  infectiousDisease: "https://www.massgeneralbrigham.org/en/services/infectious-diseases",
  neurology: "https://www.massgeneralbrigham.org/en/services/neuroscience/neurology",
  neurosurgery: "https://www.massgeneralbrigham.org/en/services/neuroscience/neurosurgery",
  urology: "https://www.massgeneralbrigham.org/en/services/urology",
  dermatology: "https://www.massgeneralbrigham.org/en/services/dermatology",
  allergy: "https://www.massgeneralbrigham.org/en/services/allergy-immunology",
  ophthalmology: "https://www.massgeneralbrigham.org/en/services/ophthalmology",
  rheumatology: "https://www.massgeneralbrigham.org/en/services/rheumatology",
  heart: "https://www.massgeneralbrigham.org/en/services/heart-vascular",
  cardiology: "https://www.massgeneralbrigham.org/en/services/heart-vascular/cardiology",
  vascular: "https://www.massgeneralbrigham.org/en/services/heart-vascular/vascular",
  bariatric: "https://www.massgeneralbrigham.org/en/services/weight-loss-surgery",
  homeCare: "https://www.massgeneralbrigham.org/en/services/home-care",
  homeHospital: "https://www.massgeneralbrigham.org/en/services/home-hospital",
  healthcareAtHome: "https://www.massgeneralbrigham.org/en/services/healthcare-at-home",
  nutrition: "https://www.massgeneralbrigham.org/en/services/nutrition",
  pathology: "https://www.massgeneralbrigham.org/en/services/pathology",
};

Object.assign(MGB_DESTINATIONS, {
  providers: IA_DESTINATIONS.providers,
  services: IA_DESTINATIONS.services,
  patientVisitor: IA_DESTINATIONS.patientVisitor,
  billing: IA_DESTINATIONS.billing,
  cmsChargeData: IA_DESTINATIONS.cmsChargeData,
  financialAssistance: IA_DESTINATIONS.financialAssistance,
  medicalRecords: IA_DESTINATIONS.medicalRecords,
  patientGateway: IA_DESTINATIONS.patientGateway,
  visitorPolicy: IA_DESTINATIONS.visitorPolicy,
  webPrivacyPolicy: IA_DESTINATIONS.webPrivacyPolicy,
  medicalProfessionals: IA_DESTINATIONS.medicalProfessionals,
  educationTraining: IA_DESTINATIONS.educationTraining,
  careers: IA_DESTINATIONS.careers,
  giving: IA_DESTINATIONS.giving,

  nwhLocation: IA_DESTINATIONS.nwhAbout,
  cooleyLocation: IA_DESTINATIONS.cooleyAbout,
  mvhLocation: IA_DESTINATIONS.mvhAbout,
  nchLocation: IA_DESTINATIONS.nchAbout,
  salemLocation: IA_DESTINATIONS.salemAbout,

  imaging: IA_DESTINATIONS.imaging,
  nwhImaging: IA_DESTINATIONS.imaging,
  mvhImaging: IA_DESTINATIONS.imaging,
  nchImaging: IA_DESTINATIONS.imaging,
  cdhImaging: IA_DESTINATIONS.imaging,
  salemImaging: IA_DESTINATIONS.imaging,
  orthopedics: IA_DESTINATIONS.orthopedics,
  orthoSpine: IA_DESTINATIONS.spine,
  sportsMedicine: IA_DESTINATIONS.sportsMedicine,
  rehabilitation: IA_DESTINATIONS.physicalMedicineRehab,
  cancer: IA_DESTINATIONS.cancer,
  lungCancerScreening: IA_DESTINATIONS.lungCancer,
  obgynConcept: IA_DESTINATIONS.obgyn,
  painManagement: IA_DESTINATIONS.painManagement,
  mentalHealth: IA_DESTINATIONS.mentalHealth,
  sleepMedicine: IA_DESTINATIONS.sleep,
  pediatrics: IA_DESTINATIONS.children,
  primaryCare: IA_DESTINATIONS.primaryCare,
  emergency: IA_DESTINATIONS.emergency,
  diabetes: IA_DESTINATIONS.diabetes,
  diabetesPregnancy: IA_DESTINATIONS.diabetesPregnancy,
  gastroenterology: IA_DESTINATIONS.gastroenterology,
  infectiousDisease: IA_DESTINATIONS.infectiousDisease,
  neurology: IA_DESTINATIONS.neurology,
  urology: IA_DESTINATIONS.urology,
  dermatology: IA_DESTINATIONS.dermatology,
  allergy: IA_DESTINATIONS.allergy,
  ophthalmology: IA_DESTINATIONS.ophthalmology,
  rheumatology: IA_DESTINATIONS.rheumatology,
  heart: IA_DESTINATIONS.heart,
  cardiology: IA_DESTINATIONS.cardiology,
  vascular: IA_DESTINATIONS.vascular,
  bariatric: IA_DESTINATIONS.bariatric,
  homeCare: IA_DESTINATIONS.homeCare,
  homeHospital: IA_DESTINATIONS.homeHospital,
  healthcareAtHome: IA_DESTINATIONS.healthcareAtHome,
  substanceUse: IA_DESTINATIONS.substanceUse,
  colorectalScreening: IA_DESTINATIONS.colorectalCancer,
  infertilityLocation: IA_DESTINATIONS.obgyn,
});

function iaPath(row) { return pathFromUrl(row.sourceUrl || "").toLowerCase(); }
function iaText(row) { return textForRow(row); }
function iaHost(row) { return hostForRow(row); }

function iaHospitalAboutForSource(row) {
  const host = iaHost(row);
  const text = iaText(row);
  if (host.includes("nwh") || text.includes("newton-wellesley")) return IA_DESTINATIONS.nwhAbout;
  if (host.includes("cooley") || text.includes("cooley dickinson")) return IA_DESTINATIONS.cooleyAbout;
  if (host.includes("mvhospital") || text.includes("martha's vineyard") || text.includes("marthas vineyard")) return IA_DESTINATIONS.mvhAbout;
  if (host.includes("nantucket") || text.includes("nantucket cottage")) return IA_DESTINATIONS.nchAbout;
  if (host.includes("salem") || text.includes("salem hospital")) return IA_DESTINATIONS.salemAbout;
  return IA_DESTINATIONS.locations;
}

function iaHospitalGivingForSource(row) {
  const host = iaHost(row);
  const text = iaText(row);
  if (host.includes("nwh") || text.includes("newton-wellesley")) return IA_DESTINATIONS.nwhGiving;
  if (host.includes("cooley") || text.includes("cooley dickinson")) return IA_DESTINATIONS.cooleyGiving;
  if (host.includes("mvhospital") || text.includes("martha's vineyard") || text.includes("marthas vineyard")) return IA_DESTINATIONS.mvhGiving;
  if (host.includes("nantucket") || text.includes("nantucket cottage")) return IA_DESTINATIONS.nchGiving;
  if (host.includes("salem") || text.includes("salem hospital")) return IA_DESTINATIONS.salemGiving;
  return IA_DESTINATIONS.giving;
}

function iaIsGivingSource(row) {
  const host = iaHost(row);
  const text = iaText(row);
  return host.includes("giving.") || host.includes("giftplanning.") || text.includes("planned giving") || text.includes("gift planning") || text.includes("development office");
}

function iaIsAboutInstitutional(row) {
  const path = iaPath(row);
  const text = iaText(row);
  if (path.includes("/medical-services/") || path.includes("/radiology/") || path.includes("/maternity/") || path.includes("/orthopedics/") || path.includes("/patients-and-visitors/")) return false;
  return path.includes("/about-us") || path.includes("/history") || path.includes("/quality") || path.includes("/facts") || path.includes("/community") || path.includes("/leadership") || text.includes("about newton-wellesley") || text.includes("about cooley") || text.includes("about nantucket") || text.includes("about martha") || text.includes("about salem");
}

function iaIsLactationSource(row) {
  const text = iaText(row);
  const path = iaPath(row);
  return path.includes("lactationbreastfeeding") || text.includes("lactation") || text.includes("breastfeeding") || text.includes("breast milk") || text.includes("breast pump");
}

function iaIsChildbirthClassSource(row) {
  const text = iaText(row);
  const path = iaPath(row);
  return path.includes("/maternity/childbirth-education") || text.includes("childbirth education") || text.includes("cesarean birth class") || text.includes("natural childbirth") || text.includes("infant care") || text.includes("spinning babies");
}

function iaIsPatientVisitPlanning(row) {
  const path = iaPath(row);
  const text = iaText(row);
  return path.includes("/planning-your-visit") || text.includes("visitor policy") || text.includes("visiting") || text.includes("shuttle") || text.includes("taxi") || text.includes("parking") || text.includes("hotel") || text.includes("free wi-fi") || text.includes("phone numbers") || text.includes("smoke-free campus") || text.includes("public transportation");
}

function iaPlanningDecision(row) {
  const text = iaText(row);
  if (text.includes("visitor policy") || text.includes("visitor restrictions")) return redirect(IA_DESTINATIONS.visitorPolicy, "IA visitor policy mapping", "Mapped to IA Full URL for Visitor Policy.", 0.94);
  if (text.includes("parking") || text.includes("directions")) return redirect(IA_DESTINATIONS.directionsParking, "IA directions/parking mapping", "Mapped to IA Full URL for Getting Here and Parking.", 0.9);
  if (text.includes("hotel")) return redirect(IA_DESTINATIONS.accommodations, "IA accommodations mapping", "Mapped to IA Full URL for Where to Stay Nearby.", 0.9);
  if (text.includes("shuttle") || text.includes("taxi") || text.includes("public transportation")) return redirect(IA_DESTINATIONS.shuttles, "IA shuttle/transportation mapping", "Mapped to IA Full URL for Complimentary Shuttles.", 0.86);
  if (text.includes("wi-fi") || text.includes("wifi")) return redirect(IA_DESTINATIONS.wifiCharging, "IA WiFi planning mapping", "Mapped to IA Full URL for WiFi and Charging Access.", 0.86);
  return redirect(IA_DESTINATIONS.planningVisit, "IA planning-your-visit mapping", "Mapped to IA Full URL for Plan Your Visit.", 0.84);
}

function iaIsBillingSource(row) {
  const text = iaText(row);
  const path = iaPath(row);
  return path.includes("/billing-and-records/") || text.includes("billing") || text.includes("insurance") || text.includes("charge data") || text.includes("financial assistance") || text.includes("medical records") || text.includes("patient gateway");
}

function iaBillingDecision(row) {
  const text = iaText(row);
  if (text.includes("cms-required") || text.includes("cms required") || text.includes("charge data")) return redirect(IA_DESTINATIONS.cmsChargeData, "IA CMS charge data mapping", "Mapped to IA Full URL for CMS-Required Hospital Charge Data.", 0.98);
  if (text.includes("preventive health")) return redirect(IA_DESTINATIONS.preventiveBilling, "IA preventive billing mapping", "Mapped to IA Full URL for Preventive Health Exam Billing.", 0.95);
  if (text.includes("outpatient")) return redirect(IA_DESTINATIONS.outpatientBilling, "IA outpatient billing mapping", "Mapped to IA Full URL for Physician Office and Hospital Outpatient Billing.", 0.93);
  if (text.includes("financial assistance") || text.includes("help with financial")) return redirect(IA_DESTINATIONS.financialAssistance, "IA financial assistance mapping", "Mapped to IA Full URL for Financial Assistance.", 0.93);
  if (text.includes("medical records")) return redirect(IA_DESTINATIONS.medicalRecords, "IA medical records mapping", "Mapped to IA Full URL for Medical Records.", 0.9);
  if (text.includes("patient gateway")) return redirect(IA_DESTINATIONS.patientGateway, "IA Patient Gateway mapping", "Mapped to IA Full URL for Patient Gateway.", 0.9);
  if (text.includes("insurance")) return redirect(IA_DESTINATIONS.billingInsurance, "IA billing/insurance mapping", "Mapped to IA Full URL for Billing and Insurance Information.", 0.88);
  return redirect(IA_DESTINATIONS.billing, "IA billing mapping", "Mapped to IA Full URL for Billing Overview.", 0.9);
}

function iaIsPatientRights(row) {
  const text = iaText(row);
  const path = iaPath(row);
  return path.includes("patient-rights") || path.includes("your-rights-patient") || text.includes("patient rights") || text.includes("rights and responsibilities");
}

function iaIsRadiologySource(row) {
  const text = iaText(row);
  const path = iaPath(row);
  return path.includes("/radiology/") || path.includes("/womens-imaging-center/") || text.includes("radiology") || text.includes("imaging") || text.includes("ct scan") || text.includes("mri") || text.includes("x-ray") || text.includes("ultrasound") || text.includes("mammogram") || text.includes("fluoroscopy") || text.includes("nuclear medicine");
}

function iaIsServicesParentTooBroad(destination) {
  const clean = String(destination || "").replace(/\/$/, "");
  return clean === "https://www.massgeneralbrigham.org/en/services" ||
    clean === "https://www.massgeneralbrigham.org/en/patients-visitors" ||
    clean === "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties" ||
    clean === "https://www.massgeneralbrigham.org/en/patient-care/patient-visitor-information";
}

const decideMappingBeforeIaSourceTruth = decideMapping;
decideMapping = function iaSourceTruthDecideMapping(row, destinationCandidates) {
  if (iaIsGivingSource(row)) {
    return redirect(iaHospitalGivingForSource(row), "IA hospital-specific giving mapping", "Mapped to the hospital-specific Giving Full URL from the IA workbook.", 0.94);
  }
  if (iaIsAboutInstitutional(row)) {
    return redirect(iaHospitalAboutForSource(row), "IA hospital About mapping", "Hospital-level institutional content mapped to the hospital-specific About Full URL from the IA workbook.", 0.9);
  }
  if (iaIsPatientRights(row)) {
    return redirect(IA_DESTINATIONS.patientRights, "IA patient rights mapping", "Mapped to IA Full URL for Rights and Responsibilities as a Patient.", 0.96);
  }
  if (iaText(row).includes("hipaa")) {
    return redirect(IA_DESTINATIONS.hipaa, "IA HIPAA notice mapping", "Mapped to IA Full URL for HIPAA notice.", 0.98);
  }
  if (iaText(row).includes("privacy policy") || iaPath(row).includes("privacy-policy")) {
    return redirect(IA_DESTINATIONS.webPrivacyPolicy, "IA web privacy policy mapping", "Mapped to IA Full URL for Web Privacy Policy.", 0.98);
  }
  if (iaIsBillingSource(row)) {
    return iaBillingDecision(row);
  }
  if (iaIsPatientVisitPlanning(row)) {
    return iaPlanningDecision(row);
  }
  if (iaIsLactationSource(row)) {
    return redirect(IA_DESTINATIONS.lactationSupport, "IA lactation support mapping", "Mapped to IA Full URL for Lactation Support Program.", 0.94);
  }
  if (iaIsChildbirthClassSource(row)) {
    return human(IA_DESTINATIONS.obgyn, "Childbirth class requires HUMAN CHECK", "No one-to-one childbirth education Full URL appears in the IA workbook; suggested IA service family is Obstetrics & Gynecology.", 0.4);
  }
  if (iaIsRadiologySource(row)) {
    const text = iaText(row);
    if (text.includes("lung cancer") || text.includes("low-dose ct") || text.includes("low dose ct")) {
      return redirect(IA_DESTINATIONS.lungCancer, "IA lung cancer mapping", "Mapped to IA Full URL for Lung Cancer Program.", 0.92);
    }
    return redirect(IA_DESTINATIONS.imaging, "IA imaging mapping", "Radiology/imaging pages mapped to the IA Full URL for Imaging.", 0.9);
  }

  const decision = decideMappingBeforeIaSourceTruth(row, destinationCandidates);
  if (decision && decision.bucket === "redirect" && iaIsServicesParentTooBroad(decision.destinationUrl)) {
    return human(decision.destinationUrl, "IA broad parent requires HUMAN CHECK", "The IA-aligned automated result was only a broad parent page. Review for a more specific Full URL before adding to CSV.", decision.score || 0.3);
  }
  return decision;
};

const categoryFallbackBeforeIaSourceTruth = categoryFallback;
categoryFallback = function iaSourceTruthCategoryFallback(row, destinationCandidates) {
  if (iaIsGivingSource(row)) return route(iaHospitalGivingForSource(row), "IA hospital-specific giving mapping", "Hospital-specific Giving Full URL from IA workbook.", 0.94);
  if (iaIsAboutInstitutional(row)) return route(iaHospitalAboutForSource(row), "IA hospital About mapping", "Hospital-specific About Full URL from IA workbook.", 0.9);
  if (iaIsRadiologySource(row)) return route(IA_DESTINATIONS.imaging, "IA imaging mapping", "Imaging Full URL from IA workbook.", 0.9);
  return categoryFallbackBeforeIaSourceTruth(row, destinationCandidates);
};
