const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { monitorOffline } = require("./lib/monitor");

admin.initializeApp({ databaseURL: process.env.FIREBASE_DATABASE_URL || "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app" });

const twilioSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioToken = defineSecret("TWILIO_AUTH_TOKEN");

// Sender can be configured as non-secret environment values in the Functions runtime.
// For India, configure an approved sender or messaging service with the provider's DLT requirements.
exports.monitorColdGuardOffline = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Kolkata",
  region: "asia-south1",
  secrets: [twilioSid, twilioToken],
  timeoutSeconds: 120,
  memory: "256MiB"
}, async () => {
  const result = await monitorOffline(admin.database(), {
    sid: twilioSid.value(),
    token: twilioToken.value(),
    from: process.env.TWILIO_FROM || "",
    serviceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || ""
  });
  console.log("ColdGuard offline monitor completed", JSON.stringify(result));
});
