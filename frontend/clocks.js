// ============================================================
// WEATHER ICON + LIVE CLOCKS
// ============================================================

// Holds the setInterval id for the ticking clocks so we can clear it
// between searches — otherwise old intervals would pile up and the
// displayed time would update faster and faster.
let clockIntervalId = null;

// --- Weather icon -------------------------------------------------
//
// The backend does NOT return a weather condition (sunny/rainy/etc.),
// only temperature/humidity/windSpeed, plus the destination's timezone.
// Rather than always showing the same "sunny" icon regardless of
// conditions, this combines what we DO have into a reasonable mood:
//   - humidity is used as a proxy for cloud cover / rain likelihood
//     (high humidity -> clouds/rain is a common, if imperfect, signal)
//   - the destination's LOCAL hour (from its timezone) decides day vs.
//     night, so a clear evening shows a moon instead of a sun
//   - very low temperature shows snow instead of rain
//   - windSpeed still controls how fast clouds drift
// This is a deliberate approximation, clearly documented so it's easy
// to replace with a direct lookup once a real `condition` field exists.

const WEATHER_ICONS = {
  clearDay: `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <g class="sun-rays" fill="none" stroke-width="2" stroke-linecap="round">
        <line x1="20" y1="2" x2="20" y2="7" />
        <line x1="20" y1="33" x2="20" y2="38" />
        <line x1="2" y1="20" x2="7" y2="20" />
        <line x1="33" y1="20" x2="38" y2="20" />
        <line x1="7.3" y1="7.3" x2="10.8" y2="10.8" />
        <line x1="29.2" y1="29.2" x2="32.7" y2="32.7" />
        <line x1="7.3" y1="32.7" x2="10.8" y2="29.2" />
        <line x1="29.2" y1="10.8" x2="32.7" y2="7.3" />
      </g>
      <circle class="sun-core" cx="20" cy="20" r="9" />
    </svg>`,
  clearNight: `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle class="star-dot" cx="30" cy="10" r="1.2" />
      <circle class="star-dot" cx="33" cy="18" r="1" />
      <path class="moon-body moon-glow" d="M23 8a13 13 0 1 0 9 22 10.5 10.5 0 0 1-9-22z" />
    </svg>`,
  cloudy: `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path class="cloud-body cloud-drift" d="M9 28a7 7 0 0 1 .7-13.9A9 9 0 0 1 27 16.5 6 6 0 0 1 26.5 29H10a5 5 0 0 1-1-1z" />
    </svg>`,
  rainy: `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path class="cloud-body cloud-drift" d="M9 22a7 7 0 0 1 .7-13.9A9 9 0 0 1 27 10.5 6 6 0 0 1 26.5 23H10a5 5 0 0 1-1-1z" />
      <line class="rain-drop" x1="14" y1="27" x2="12" y2="34" stroke-width="2" stroke-linecap="round" />
      <line class="rain-drop" x1="20" y1="27" x2="18" y2="34" stroke-width="2" stroke-linecap="round" />
      <line class="rain-drop" x1="26" y1="27" x2="24" y2="34" stroke-width="2" stroke-linecap="round" />
    </svg>`,
  snow: `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path class="cloud-body" opacity="0.6" d="M8 20a6 6 0 0 1 .6-11.9A8 8 0 0 1 24 9.5 5.5 5.5 0 0 1 23.5 21H9a5 5 0 0 1-1-1z" />
      <circle class="snow-dot" cx="12" cy="28" r="1.8" />
      <circle class="snow-dot" cx="19" cy="32" r="1.8" />
      <circle class="snow-dot" cx="26" cy="27" r="1.8" />
    </svg>`,
};

/**
 * Reads the current hour (0–23) in a given IANA timezone, so we can
 * tell day from night at the destination rather than the viewer's own.
 * @param {string} timezone
 * @returns {number|null} hour in 24h time, or null if the timezone is invalid
 */
function getHourInTimezone(timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? parseInt(hourPart.value, 10) % 24 : null;
  } catch (err) {
    return null;
  }
}

/**
 * Picks and renders an animated weather icon from temperature, humidity,
 * windSpeed, and the destination's local hour. See the comment above
 * WEATHER_ICONS for the reasoning behind each threshold.
 * @param {number} temperature in Celsius
 * @param {number} humidity as a percentage (0-100)
 * @param {number} windSpeed in m/s
 * @param {string} timezone IANA timezone of the destination
 */
function renderWeatherIcon(temperature, humidity, windSpeed, timezone) {
  const hour = getHourInTimezone(timezone);
  const isNight = hour !== null && (hour < 6 || hour >= 20);

  let mood;
  if (temperature <= 3) mood = "snow";
  else if (humidity >= 85) mood = "rainy";
  else if (humidity >= 60) mood = "cloudy";
  else mood = isNight ? "clearNight" : "clearDay";

  const weatherIconEl = document.getElementById("weatherIcon");
  weatherIconEl.innerHTML = WEATHER_ICONS[mood];

  // Faster wind -> faster (but still gentle) drift. Clamped so the
  // animation never becomes jarring at very high wind speeds.
  const driftSeconds = Math.min(4.2, Math.max(1.6, 4.2 - windSpeed * 0.15));
  weatherIconEl.style.setProperty("--drift-duration", `${driftSeconds}s`);
}

// --- Date/time formatting ------------------------------------------

/**
 * Formats a Date as a short "Weekday, Month Day" string, e.g. "Wed, Aug 20".
 * @param {Date} date
 * @param {string} [timeZone] IANA timezone; omitted = viewer's own device timezone.
 */
function formatDateLabel(date, timeZone) {
  const options = { weekday: "long", month: "long", day: "numeric" };
  if (timeZone) options.timeZone = timeZone;
  return date.toLocaleDateString(undefined, options);
}

/**
 * Formats a Date as a 12-hour clock time, e.g. "9:15 PM".
 * @param {Date} date
 * @param {string} [timeZone]
 */
function formatTimeLabel(date, timeZone) {
  const options = { hour: "numeric", minute: "2-digit", hour12: true };
  if (timeZone) options.timeZone = timeZone;
  return date.toLocaleTimeString(undefined, options);
}

/**
 * Starts (and keeps refreshed) the three time readouts: today's date,
 * the viewer's own local time, and the destination's local time —
 * derived from the IANA timezone string the backend returned
 * (destination.timezone, e.g. "Europe/Berlin"). Both clocks come from
 * the same underlying `Date`; only the display timezone differs, so no
 * manual UTC-offset math is needed.
 * @param {string} timezone IANA timezone name for the destination
 * @param {string} cityName used to label the destination clock
 */
function startClocks(timezone, cityName) {
  const todayValueEl = document.getElementById("todayValue");
  const yourTimeValueEl = document.getElementById("yourTimeValue");
  const cityTimeLabelEl = document.getElementById("cityTimeLabel");
  const cityTimeValueEl = document.getElementById("cityTimeValue");

  cityTimeLabelEl.textContent = cityName;

  function tick() {
    const now = new Date();

    todayValueEl.textContent = formatDateLabel(now);
    yourTimeValueEl.textContent = formatTimeLabel(now);

    try {
      cityTimeValueEl.textContent = formatTimeLabel(now, timezone);
    } catch (err) {
      // Guards against an unexpected/invalid timezone string from the API.
      cityTimeValueEl.textContent = "—";
    }
  }

  // Stop any previous ticking clock before starting a new one.
  if (clockIntervalId !== null) clearInterval(clockIntervalId);

  tick(); // paint immediately instead of waiting a full second
  clockIntervalId = setInterval(tick, 1000);
}

/** Stops the ticking clocks, e.g. when leaving the results view. */
function stopClocks() {
  if (clockIntervalId !== null) {
    clearInterval(clockIntervalId);
    clockIntervalId = null;
  }
}
