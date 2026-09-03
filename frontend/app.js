// ============================================================
// APP CONTROLLER
// Wires up the search UI, decides which top-level view is showing
// (loading / error / results), and calls into api.js / render.js.
// This is the only file that changes what's visible on screen at
// the top level.
// ============================================================

const cityInput = document.getElementById("cityInput");
const planTripBtn = document.getElementById("planTripBtn");
const fieldError = document.getElementById("fieldError");

const idleCard = document.getElementById("idleCard");
const idleChips = document.getElementById("idleChips");
const loadingCard = document.getElementById("loadingCard");
const errorCard = document.getElementById("errorCard");
const errorMessageEl = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");
const resultsSection = document.getElementById("results");

// All four top-level panels, in one place, so setView can loop over them
// instead of repeating the same show/hide logic four times.
const PANELS = { idle: idleCard, loading: loadingCard, error: errorCard, results: resultsSection };

/**
 * Shows exactly one of idle / loading / error / results and hides the
 * others. This sets `element.style.display` directly (not just the
 * `hidden` attribute) so visibility never depends on a stylesheet rule
 * cooperating with `[hidden]` — a component's own `display: flex` rule
 * can otherwise win the cascade and leave a "hidden" panel visible.
 * @param {"idle"|"loading"|"error"|"results"} view
 */
function setView(view) {
  Object.entries(PANELS).forEach(([name, el]) => {
    const isVisible = name === view;
    el.hidden = !isVisible;
    el.style.display = isVisible ? "" : "none";
  });

  // The destination clocks only make sense while results are visible.
  if (view !== "results") stopClocks();
}

/** Shows the error card with a friendly, backend-detail-free message. */
function showError(message) {
  errorMessageEl.textContent = message;
  setView("error");
}

/**
 * Scrolls the results section to the top of the viewport once new
 * results are rendered, so the user lands on the itinerary instead of
 * staying wherever they were on the (now-hidden) loading card.
 */
function scrollToResults() {
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Main search flow: validates input, calls the backend, and routes
 * the outcome to the loading / results / error view.
 */
async function planTrip() {
  const city = cityInput.value.trim();

  // Empty input gets a small inline message, not the big error card.
  if (!city) {
    fieldError.hidden = false;
    fieldError.style.display = "";
    cityInput.focus();
    return;
  }
  fieldError.hidden = true;
  fieldError.style.display = "none";

  setView("loading");
  planTripBtn.disabled = true;

  try {
    const data = await fetchTripPlan(city);

    if (!data || data.success !== true) {
      // Backend reached us but reported a logical failure
      // (e.g. city not found, or geocoding failed).
      showError(data && data.message ? data.message : "We couldn't plan a trip for that city. Please try another one.");
      return;
    }

    if (!isValidTripResponse(data)) {
      // Backend said success, but the shape isn't what we expect —
      // fail safely instead of crashing while rendering.
      showError("We received an unexpected response. Please try again.");
      return;
    }

    renderResults(data);
    setView("results");
    scrollToResults();
  } catch (err) {
    // Covers network failures, timeouts, and JSON parse errors.
    console.error("Trip planning request failed:", err);
    showError("Something went wrong while connecting to the travel planner.");
  } finally {
    planTripBtn.disabled = false;
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

planTripBtn.addEventListener("click", planTrip);

// Pressing Enter inside the input field also triggers a search.
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    planTrip();
  }
});

// Typing again after seeing the empty-input message clears it.
cityInput.addEventListener("input", () => {
  if (!fieldError.hidden) {
    fieldError.hidden = true;
    fieldError.style.display = "none";
  }
});

// Destination chips (idle state): fill the input and search right away.
idleChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  cityInput.value = chip.dataset.city;
  planTrip();
});

// "Try again" re-runs the search for whatever city is still in the
// input (the field isn't cleared on error), going straight back
// through loading -> results/error rather than dumping the user
// back at an empty idle view.
retryBtn.addEventListener("click", () => {
  planTrip();
});

// Start on the idle view (no loading/error/results panel showing).
setView("idle");
