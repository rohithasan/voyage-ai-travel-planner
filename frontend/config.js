// ============================================================
// CONFIG
// ============================================================
// This is the ONLY place the backend URL should appear in the app.
// Replace this with your real n8n webhook URL when it's ready —
// nothing else needs to change.
//
// The backend expects a POST request with a JSON body like:
//   { "city": "Berlin" }
// ============================================================
// Local n8n webhook used during development.
const API_URL = "http://localhost:5678/webhook/travel-weather";
