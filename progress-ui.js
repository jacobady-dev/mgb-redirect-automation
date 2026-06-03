const progressState = {
  active: false,
  current: 0,
  startedAt: null,
};

function progressElements() {
  return {
    overlay: document.getElementById("progressOverlay"),
    bar: document.getElementById("progressBar"),
    label: document.getElementById("progressLabel"),
    detail: document.getElementById("progressDetail"),
    percent: document.getElementById("progressPercent"),
    button: document.getElementById("generateBtn"),
  };
}

function startProgress(label = "Preparing files…", detail = "This may take a minute for larger crawls.") {
  const elements = progressElements();
  progressState.active = true;
  progressState.current = 4;
  progressState.startedAt = Date.now();
  document.body.classList.add("is-processing");
  if (elements.overlay) elements.overlay.hidden = false;
  if (elements.button) elements.button.disabled = true;
  updateProgress(4, label, detail);
}

function updateProgress(percent, label, detail = "") {
  const elements = progressElements();
  progressState.current = Math.max(progressState.current || 0, Math.min(percent, 99));
  const displayPercent = Math.round(progressState.current);
  if (elements.bar) elements.bar.style.width = `${displayPercent}%`;
  if (elements.label && label) elements.label.textContent = label;
  if (elements.detail && detail) elements.detail.textContent = detail;
  if (elements.percent) elements.percent.textContent = `${displayPercent}%`;
}

function finishProgress(label = "Workbook ready", detail = "Downloads are available below.") {
  const elements = progressElements();
  updateProgress(100, label, detail);
  if (elements.bar) elements.bar.style.width = "100%";
  if (elements.percent) elements.percent.textContent = "100%";
  window.setTimeout(() => {
    progressState.active = false;
    document.body.classList.remove("is-processing");
    if (elements.overlay) elements.overlay.hidden = true;
    if (elements.button) elements.button.disabled = false;
  }, 700);
}

function failProgress(label = "Run failed", detail = "Review the processing summary for the error.") {
  const elements = progressElements();
  updateProgress(Math.max(progressState.current || 0, 100), label, detail);
  document.body.classList.remove("is-processing");
  if (elements.overlay) elements.overlay.hidden = true;
  if (elements.button) elements.button.disabled = false;
  progressState.active = false;
}

function nextUiFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}
