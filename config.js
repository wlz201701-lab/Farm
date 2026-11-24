/* =====================================================================
   SETTINGS: this is the only file you normally need to edit.
   Save it, then upload the whole folder again.
   ===================================================================== */
"use strict";

const CONFIG = {
  // Paste your Google Apps Script "Web app" URL here (see SETUP.md).
  // While this is empty the site runs in DEMO MODE (nothing is emailed or saved).
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzL3bwYsUVTQaMTDZNcPZdA3PwjkgYGmAdLoB5J1fQ0u8yL1XFOR1u2dkOhFLHiY7I/exec",

  FARM_NAME: "Back Forty Farm",
  TAGLINE: "Fresh from our fields to your table",
  WELCOME: "Well howdy, y'all! Welcome to the farm. Have a look around, fill up a basket, and we'll work out a swap or a handoff.",

  // Used for the weather check on the order forms (look up your farm's coordinates).
  FARM_LAT: 35.33,
  FARM_LON: -81.87,

  // Shown on the "Our Farm" page map. You can also set farmAddress in the Settings tab of
  // your Google Sheet, which takes priority. Leave both blank to hide the map.
  FARM_ADDRESS: "",

  // Shown on the shop pages. The Settings tab (marketNotice) takes priority.
  MARKET_NOTICE: "Heads up: prices follow the average local market price, so they can change a little. The price we confirm when we meet is the final one.",

  MEET_METHODS: [
    { id: "work",     label: "🏢 At the farmer's work",              needs: "" },
    { id: "farm",     label: "🚜 At the farm",                       needs: "" },
    { id: "delivery", label: "🚗 After-work delivery to my address", needs: "address" },
    { id: "other",    label: "💬 Something else (tell me how)",      needs: "details" }
  ],
  TIME_SLOTS: ["Morning (8–11 am)", "Midday (11 am–2 pm)", "Afternoon (2–5 pm)", "After work (5–7 pm)"],
  VISIT_SLOTS: ["Morning (8–10 am)", "Late morning (10 am–12 pm)", "Afternoon (1–3 pm)", "Late afternoon (3–5 pm)"],

  MAX_ICONS: 24,          // most pieces of produce drawn in one pile
  REFRESH_MS: 45000,      // how often stock is re-checked while the page is open
  RAIN_CHANCE_WARN: 60,   // % chance of rain that triggers the "you can cancel" warning
  HEAVY_RAIN_IN: 0.5,     // inches of rain that triggers the warning
  GUST_WARN_MPH: 40       // wind gusts that trigger the warning
};
