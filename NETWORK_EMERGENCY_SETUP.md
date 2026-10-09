# ColdGuard Network & Emergency Monitoring Setup

This feature extends the existing Firebase Realtime Database project and Vercel-hosted dashboard. It does not configure physical device firmware, Twilio, Firebase service-account secrets, emergency contacts, or deployment secrets automatically.

## Backend environment variables

Set these in the Vercel project (Project → Settings → Environment Variables) for Production and Preview as appropriate. Do not commit values to GitHub.

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON for a Firebase service account from the same Firebase project. Grant only the database access required by the monitor.
- `FIREBASE_DATABASE_URL`: `https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app` (optional if using the built-in project default).
- `CRON_SECRET`: a long random secret. Vercel sends this as the Bearer authorization value for scheduled requests.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and either `TWILIO_FROM` or `TWILIO_MESSAGING_SERVICE_SID`.
- Optional thresholds: `OFFLINE_WARNING_MINUTES=2`, `OFFLINE_NOTIFY_MINUTES=5`, `OFFLINE_ESCALATE_MINUTES=10`.

The scheduled endpoint is `/api/monitor-offline`. Minute-level scheduling is triggered by `functions/index.js` using Firebase Cloud Scheduler, because this Vercel project is on the Hobby plan and Vercel rejected a once-per-minute cron configuration. Scheduled Cloud Functions require the Firebase Blaze billing plan.

Deployment steps:
1. In the repository root, run `cd functions && npm install && cd ..`.
2. Store the Twilio account SID and auth token as Firebase secrets: `firebase functions:secrets:set TWILIO_ACCOUNT_SID` and `firebase functions:secrets:set TWILIO_AUTH_TOKEN`.
3. Configure `TWILIO_FROM` or `TWILIO_MESSAGING_SERVICE_SID` in a local, uncommitted Firebase Functions environment file such as `functions/.env.coldguard-fdfc5`. Do not commit this file. Configure only an approved sender/service.
4. Deploy the scheduled function: `firebase deploy --only functions:monitorColdGuardOffline`.
5. Confirm the function's Cloud Scheduler job runs each minute and its logs show successful monitoring cycles.

The scheduled Firebase function reads Realtime Database directly and does not depend on the Vercel dashboard being open or publicly accessible. The separate Vercel API endpoints still need `FIREBASE_SERVICE_ACCOUNT_JSON` configured for authenticated dashboard reads, acknowledgement, and administrator test alerts.

## Emergency contacts in Realtime Database

Add these records using a trusted administrator / Firebase Console. Use E.164 phone numbers (e.g. +91 followed by the mobile number), and only enter verified, consented contacts. Numbers are not created automatically from the account profile.

```json
{
  "emergency_contacts": {
    "CG-VEHICLE-ID": {
      "driverName": "Actual driver name",
      "driverPhone": "+91XXXXXXXXXX",
      "controlRoomPhone": "+91XXXXXXXXXX",
      "emergencyName": "Actual emergency contact name",
      "emergencyPhone": "+91XXXXXXXXXX",
      "agencyName": "Actual transport agency",
      "agencyPhone": "+91XXXXXXXXXX"
    },
    "default": {
      "controlRoomPhone": "+91XXXXXXXXXX"
    }
  }
}
```

Use actual shipment IDs as keys. Shipment-specific contacts override the default contact record for that shipment. The frontend does not read or expose full phone numbers; the backend reads this path with its service account.

## SMS / India compliance

Configure an approved sender or messaging service in the SMS provider. For India, complete the provider's current business verification, DLT principal-entity registration, sender/header and approved template setup where applicable before expecting delivery. Provider acceptance is not proof that a person received or read a message. Review SMS cost and consent before enabling production alerts.

## Monitoring behavior

- A valid last sensor timestamp is required. Missing timestamps are shown as **Unknown**, not automatically declared offline.
- Default UI status: Online below 2 minutes; Network unstable from 2 minutes; Offline from 5 minutes; Emergency is reserved for a confirmed temperature excursion against configured shipment limits.
- Driver/control room are notified at the notification threshold. Emergency contact / agency are added at escalation. State and event records prevent sending on every one-minute monitor run; escalation occurs when the alert level rises.
- On recovery, a recovery event is recorded and a recovery SMS is attempted. SMS failures are recorded separately from successful provider acceptance.
- Event history and acknowledgement are stored under `network_monitoring/events`; per-shipment state is under `network_monitoring/vehicles`.
- The monitor explicitly records that temperature could not be continuously verified during a network outage.

## Local buffering requirement

This web application cannot store readings on a vehicle while the vehicle itself is disconnected from the internet. Firmware on the vehicle's MCU/gateway (e.g. ESP32 with flash/SD storage, or a Linux gateway with a durable local queue) must assign a unique reading ID, persist timestamp/GPS/temperature/humidity/device ID, retry uploads when connectivity returns, and de-duplicate by ID in the backend. Implement a bounded queue, retention policy, and a clear full-buffer warning. The dashboard only displays buffer status if firmware reports fields such as:

```json
{
  "deviceBuffer": {
    "status": "queued",
    "queuedCount": 18,
    "lastSyncAt": "2026-10-10T00:00:00.000Z"
  }
}
```

Do not use the example values as live telemetry. Without this firmware change, the dashboard will display "not reported by device."

## Authorization

- The manual test alert and acknowledgement API require a verified Firebase ID token and a profile at `users/{uid}` with `role: "admin"` or `role: "system_admin"`.
- The scheduled monitor requires `CRON_SECRET`.
- New `network_monitoring` and `emergency_contacts` data is accessed by the backend using Firebase Admin; never place service-account JSON or Twilio secrets in frontend files.
