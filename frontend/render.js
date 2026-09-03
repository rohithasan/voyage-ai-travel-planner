// ============================================================
// RENDERING
// Pure "data in, DOM out" functions. Nothing here talks to the
// network or decides which top-level view is showing — that's
// app.js's job. Keeping these separate makes each piece easy to
// reason about on its own.
//
// Everything here uses textContent (never innerHTML) for backend
// text, so nothing the API returns can be interpreted as HTML.
// ============================================================

/** Renders the destination title + itinerary summary. */
function renderDestinationHeader(itinerary) {
  document.getElementById("destinationTitle").textContent = itinerary.destination || "—";
  document.getElementById("destinationSummary").textContent = itinerary.summary || "";
}

/** Renders the weather numbers and hands off to the icon/clock helpers. */
function renderWeather(weather, destination) {
  document.getElementById("tempValue").textContent = Math.round(weather.temperature);
  document.getElementById("humidityValue").textContent = `${weather.humidity}%`;
  document.getElementById("windValue").textContent = `${weather.windSpeed} m/s`;

  renderWeatherIcon(weather.temperature, weather.humidity, weather.windSpeed, destination.timezone);
  startClocks(destination.timezone, destination.city);
}

// A small fixed palette used to color category badges. Categories we
// recognize get a deliberate color; anything else falls back to a
// deterministic color picked from the same palette (see
// `colorForCategory`) so new/unexpected categories still look
// intentional instead of unstyled.
const CATEGORY_COLORS = {
  museum: "violet",
  gallery: "violet",
  park: "sage",
  garden: "sage",
  memorial: "slate",
  monument: "slate",
  attraction: "amber",
  landmark: "amber",
  viewpoint: "teal",
  cafe: "rose",
  restaurant: "rose",
};
const CATEGORY_PALETTE = ["teal", "amber", "violet", "sage", "rose", "slate"];

/**
 * Picks a badge color for a category string. Known categories map to a
 * deliberate color; unknown ones get a stable color derived from the
 * text itself, so the same category always looks the same without us
 * having to hardcode every possible value the backend might send.
 */
function colorForCategory(category) {
  const key = (category || "").toLowerCase().trim();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];

  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

/** Returns true only for links safe to render as a clickable anchor. */
function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

/**
 * Builds a single timeline entry (one activity) as DOM nodes.
 * @param {object} activity one item from itinerary.days[].activities
 */
function createActivityItem(activity) {
  const item = document.createElement("li");
  item.className = "timeline-item";

  const node = document.createElement("div");
  node.className = "timeline-item__node";
  item.appendChild(node);

  const content = document.createElement("div");
  content.className = "timeline-item__content";

  const time = document.createElement("p");
  time.className = "timeline-item__time";
  time.textContent = activity.time || "";
  content.appendChild(time);

  const headRow = document.createElement("div");
  headRow.className = "timeline-item__head";

  const name = document.createElement("h4");
  name.className = "timeline-item__name";
  name.textContent = activity.name || "Untitled stop";
  headRow.appendChild(name);

  if (activity.category) {
    const badge = document.createElement("span");
    badge.className = `badge badge--${colorForCategory(activity.category)}`;
    badge.textContent = activity.category;
    headRow.appendChild(badge);
  }
  content.appendChild(headRow);

  if (activity.reason) {
    const reason = document.createElement("p");
    reason.className = "timeline-item__reason";
    reason.textContent = activity.reason;
    content.appendChild(reason);
  }

  // Only render a website link when one exists and it's a genuine http(s)
  // URL — no empty buttons, and no accidental javascript: links.
  if (activity.website && isSafeHttpUrl(activity.website)) {
    const link = document.createElement("a");
    link.className = "timeline-item__link";
    link.href = activity.website;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Visit website →";
    content.appendChild(link);
  }

  item.appendChild(content);
  return item;
}

/**
 * Renders every day in itinerary.days as its own "DAY N" block with a
 * vertical timeline of activities. The number of days is never assumed —
 * whatever the backend sends is what gets rendered.
 * @param {Array<object>} days itinerary.days
 */
function renderItinerary(days) {
  const container = document.getElementById("itineraryDays");
  container.innerHTML = ""; // clear any previous search's results

  if (!Array.isArray(days) || days.length === 0) {
    const empty = document.createElement("p");
    empty.className = "itinerary-empty";
    empty.textContent = "No itinerary activities were returned for this trip.";
    container.appendChild(empty);
    return;
  }

  days.forEach((day) => {
    const section = document.createElement("section");
    section.className = "day-block";

    const heading = document.createElement("h3");
    heading.className = "day-block__heading";
    heading.textContent = `Day ${day.day}`;
    section.appendChild(heading);

    const list = document.createElement("ol");
    list.className = "timeline";
    (day.activities || []).forEach((activity) => {
      list.appendChild(createActivityItem(activity));
    });
    section.appendChild(list);

    container.appendChild(section);
  });
}

/** Renders the full success response into the results view. */
function renderResults(data) {
  renderDestinationHeader(data.itinerary);
  renderWeather(data.weather, data.destination);
  renderItinerary(data.itinerary.days);
}
