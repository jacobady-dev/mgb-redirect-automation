// Small post-rules patch layer.
// Use this for targeted QA corrections without rewriting the full rule-tuning file.

MGB_DESTINATIONS.educationTraining = "https://www.massgeneralbrigham.org/en/education-and-training";
MGB_DESTINATIONS.medicalProfessionals = MGB_DESTINATIONS.educationTraining;

const decideMappingBeforePatch = decideMapping;
decideMapping = function patchedDecideMapping(row, destinationCandidates) {
  if (isMedicalEducationSource(row)) {
    return redirect(
      MGB_DESTINATIONS.educationTraining,
      "Medical education mapped to MGB Education and Training",
      "Medical education, physician education, and professional training content mapped to MGB Education and Training.",
      0.9
    );
  }
  return decideMappingBeforePatch(row, destinationCandidates);
};

const categoryFallbackBeforePatch = categoryFallback;
categoryFallback = function patchedCategoryFallback(row, destinationCandidates) {
  if (isMedicalEducationSource(row)) {
    return route(
      MGB_DESTINATIONS.educationTraining,
      "Medical education mapped to MGB Education and Training",
      "Medical education, physician education, and professional training content mapped to MGB Education and Training.",
      0.9
    );
  }
  return categoryFallbackBeforePatch(row, destinationCandidates);
};
