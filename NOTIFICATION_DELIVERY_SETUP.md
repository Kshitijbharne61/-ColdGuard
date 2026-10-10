# ColdGuard notification delivery setup

The notification center runs in **demo/preview mode** until at least one external provider is configured. Demo mode records notification events in the Alert Center and shows sample email, push, and SMS content; it does not attempt an external send.

## Vercel environment variables

Configure provider secrets only in the server environment. Never add values to index.html, js/services/notificationCenter.js, or source-controlled .env files.

| Variable | Purpose |
| --- | --- |
| FIREBASE_WEB_API_KEY | Verifies the signed-in Firebase session for notification API actions. |
| FIREBASE_DATABASE_URL | Optional override for the Realtime Database URL. |
| FIREBASE_SERVICE_ACCOUNT_JSON | Required for the durable queue worker, role-based escalation, signed one-click acknowledgement and server-only writes. Paste the service-account JSON as one env var; a base64: prefix is also supported. |
| CRON_SECRET | Random secret used to authorize /api/notifications-worker. |
| NOTIFICATION_ACTION_SECRET | Random HMAC secret for expiring, single-use email acknowledgement links. |
| APP_BASE_URL | Optional public app origin used to build alert actions and email links. |
| BREVO_API_KEY, ALERT_FROM_EMAIL, ALERT_FROM_NAME | Email provider. ALERT_EMAIL_TO can be used as a fallback recipient if no user contact is stored. |
| TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER | SMS provider. ALERT_PHONE_TO is an optional fallback recipient. |
| TWILIO_WHATSAPP_FROM | WhatsApp sender approved for the Twilio account. |
| TELEGRAM_BOT_TOKEN | Telegram bot API token. |
| FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY | Firebase Cloud Messaging server credentials. A per-user FCM registration token is stored in notification preferences. |

Generate separate long random values for CRON_SECRET and NOTIFICATION_ACTION_SECRET. Do not reuse an API token or a Firebase credential as either secret.

## Queue and worker

vercel.json schedules /api/notifications-worker every five minutes. The worker requires a Firebase Admin service account so queue records, retry state and single-use acknowledgement tokens remain server-only. Confirm the hosting plan supports this cron frequency; if the platform rejects the schedule, use a plan/scheduler that supports five-minute jobs or invoke the endpoint from an external scheduler with Authorization: Bearer <CRON_SECRET>.

The worker retries failed sends with exponential backoff, stores per-recipient/channel delivery states, uses configured fallback channels after repeated failure, and advances acknowledgement escalation. It cancels queued jobs when an alert is acknowledged or resolved.

## User data and role escalation

User contacts and per-user preferences are stored under users/<uid>/emergencyContact and users/<uid>/notificationPreferences. Escalation targets are resolved from user records whose role or userRole is driver, hub_manager, or logistics_admin. Store roles through a trusted admin workflow—do not let an ordinary user elevate their own role in the database. Notification history is private under users/<uid>/notificationCenter; queue, rate-limit, and single-use-action-token records are server-only.

## Smoke test

1. Sign in and open **Alert Center**.
2. Click **Send test alert**. With no providers configured, the event should appear in the list, toast, channel previews and timeline with a “Demo preview · not sent” indicator.
3. Add one provider and recipient, configure all environment variables and redeploy.
4. Verify email/SMS/push delivery on the appropriate test addresses/devices. Open an acknowledgement link once, confirm the alert is acknowledged and escalation is stopped; the link should not be reusable.
5. Trigger Heatwave Ahead, Sensor Drift or another existing Simulation Lab scenario and verify it appears as the corresponding alert. Restore the condition and check the resolved timeline.

The temperature/spoilage predictions are operational estimates; alert messages should not replace validation of source telemetry or the approved cold-chain response procedure.
