// Copy this file to secrets.h locally and fill in your own values.
// Do not commit secrets.h. Rotate any device token that was previously committed.
#ifndef COLDGUARD_SECRETS_H
#define COLDGUARD_SECRETS_H

#define SECRET_WIFI_SSID      "YOUR_WIFI_SSID"
#define SECRET_WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"

#define DEVICE_ID             "YOUR_PROVISIONED_DEVICE_ID"
#define DEVICE_SECRET_TOKEN   "GENERATE_A_NEW_RANDOM_DEVICE_TOKEN"
#define ASSIGNED_SHIPMENT_ID  "YOUR_ASSIGNED_SHIPMENT_ID"

#define CLOUD_FUNCTION_URL    "https://asia-southeast1-coldguard-fdfc5.cloudfunctions.net/ingestDualSensorTelemetry"
#define GPS_INGEST_URL        "https://asia-southeast1-coldguard-fdfc5.cloudfunctions.net/ingestGpsTelemetry"
#define FIREBASE_RTDB_URL     "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app"

#endif
