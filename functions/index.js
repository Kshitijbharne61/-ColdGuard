const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");

const coldGuardCronSecret = defineSecret("COLDGUARD_CRON_SECRET");
const MONITOR_URL = "https://12-kshitijbharne.vercel.app/api/monitor-offline";

// Runs independently of the driver's browser. Requires Firebase Blaze billing
// because scheduled Cloud Functions use Cloud Scheduler.
exports.monitorColdGuardOffline = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Kolkata",
  region: "asia-south1",
  secrets: [coldGuardCronSecret],
  timeoutSeconds: 120,
  memory: "256MiB"
}, async () => {
  const response = await fetch(MONITOR_URL, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + coldGuardCronSecret.value(),
      Accept: "application/json"
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) {
    throw new Error("ColdGuard monitor returned HTTP " + response.status + ": " + (body.error || "unknown error"));
  }
  console.log("ColdGuard monitor completed", JSON.stringify(body.counts || {}));
});
