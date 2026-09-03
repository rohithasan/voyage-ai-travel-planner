// ============================================================
// API LAYER
// All communication with the n8n backend lives here. Nothing else
// in the app should call `fetch` directly — this keeps the request
// logic in one place and easy to change later (e.g. adding retries,
// auth headers, etc.) without touching the UI code.
// ============================================================

/**
 * Sends the city to the n8n webhook and returns the parsed JSON response.
 * Throws a plain Error for network failures or non-2xx HTTP statuses;
 * callers decide how to translate that into a message for the user.
 * @param {string} city
 * @returns {Promise<object>} the raw parsed response body
 */
async function fetchTripPlan(city) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city }),
  });

  if (!response.ok) {
    // A non-2xx status means the request reached a server but it
    // rejected/failed to handle it (as opposed to a network error,
    // which throws before we even get a response).
    throw new Error(`Server responded with status ${response.status}`);
  }

  return response.json();
}

/**
 * Checks that a successful response actually has the shape the UI
 * expects, so a malformed backend response fails loudly and safely
 * instead of causing a confusing crash somewhere deep in rendering.
 * @param {object} data
 * @returns {boolean}
 */
function isValidTripResponse(data) {
  return (
    data &&
    typeof data === "object" &&
    data.destination &&
    typeof data.destination.city === "string" &&
    typeof data.destination.country === "string" &&
    typeof data.destination.timezone === "string" &&
    data.weather &&
    typeof data.weather.temperature === "number" &&
    typeof data.weather.humidity === "number" &&
    typeof data.weather.windSpeed === "number" &&
    data.itinerary &&
    Array.isArray(data.itinerary.days)
  );
}
