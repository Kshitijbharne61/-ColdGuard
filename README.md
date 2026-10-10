# ColdGuard

**ColdGuard** is a cold-chain monitoring and shipment-quality project designed to help track temperature-sensitive shipments, monitor sensor and GPS data, identify potential risks, and support timely responses when shipment conditions become unsafe.

> **Project status:** Features depend on the connected hardware, Firebase configuration, and deployed services. Configure and test integrations before using ColdGuard for real shipments.

## Overview

ColdGuard aims to bring shipment visibility and cold-chain integrity monitoring into one place. It is intended to help users:

- Monitor shipment conditions and sensor readings.
- View shipment location and GPS tracking information.
- Identify possible temperature excursions, device issues, or data-connection problems.
- Review shipment quality information and generate shipment reports where the relevant module is configured.
- Support incident response by presenting useful shipment and nearby cold-storage information, when that integration is enabled.

## Key Areas

- **Monitoring dashboard** — a central view of available shipment and sensor information.
- **GPS and shipment tracking** — location visibility from the configured GPS data source.
- **Alerts** — intended to notify users about configured threshold violations or operational problems. Email delivery requires valid provider credentials and working server-side configuration.
- **Shipment quality assessment** — assess recorded shipment data against configured rules.
- **Reporting** — PDF report generation, if enabled in the deployed version.
- **Firebase integration** — database and application services depend on the project's Firebase setup.
- **Vercel deployment** — supports deployment of the configured web application and server-side endpoints.

## Technology

The repository includes a Node.js dependency manifest for a ColdGuard GPS ingestion API, including `firebase-admin`. The exact frontend framework, sensor hardware, and other services depend on the implementation currently present in the repository.

- **JavaScript / Node.js** — server-side ingestion dependencies
- **Firebase Admin SDK** — server-side Firebase access
- **Vercel** — deployment and hosting for configured endpoints and/or the web app
- **GPS and sensor devices** — data sources, when connected

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Kshitijbharne61/-ColdGuard.git
cd -ColdGuard
```

### 2. Inspect the project

Check the repository's files and package manifests to identify the frontend and API entry points. The root `package.json` currently declares the `firebase-admin` dependency for the GPS ingestion API.

### 3. Install dependencies

For the Node.js component that uses the root manifest:

```bash
npm install
```

Use the scripts defined by the relevant `package.json` to run or build a component. If the frontend is in a separate directory, install its dependencies from that directory as well.

### 4. Configure Firebase and environment variables

Set up a Firebase project and configure the server-side credentials required by the application. Store secrets in local environment files or your hosting provider's environment-variable settings; **never commit service-account JSON files, API keys, passwords, verification codes, or other secrets to GitHub**.

Use the exact variable names expected by the code. Review the deployment configuration before enabling ingestion, alerts, or reporting.

### 5. Run and deploy

Run the development/build commands documented by the relevant project manifest. To deploy on Vercel, import this GitHub repository into Vercel, select the correct root directory and build settings, configure required environment variables, and deploy. Check the deployment logs after publishing.

## Configuration and Safety

Before using the project with real shipments:

- Confirm that sensor readings and timestamps are valid and up to date.
- Verify GPS updates and device connectivity.
- Test alert thresholds and email delivery end to end.
- Confirm Firebase access rules and server-side permissions.
- Test report generation and review the report data for accuracy.
- Do not rely on a dashboard alone for vaccine, medicine, or other temperature-sensitive cargo safety decisions; follow the applicable cold-chain procedures and validated monitoring requirements.

## Troubleshooting

- **Dashboard does not load:** check the browser console, deployment build logs, routes, and environment configuration.
- **No sensor or GPS data:** confirm the device/network connection, ingestion endpoint, Firebase configuration, and database records.
- **Email alerts do not arrive:** verify the email provider configuration, server-side secrets, recipient address, and provider logs; test with a known threshold breach.
- **Firebase errors:** check the project's credentials, enabled services, permissions, and security rules.
- **Deployment fails:** review the Vercel build output, root directory, install command, and required environment variables.

## Contributing

Contributions and bug reports are welcome. Before submitting a change:

1. Describe the issue or improvement.
2. Test the affected functionality.
3. Avoid committing credentials or shipment data that should remain private.
4. Submit a pull request with a clear summary of the changes.

## License

No license information is specified here. Unless a license is added to this repository, do not assume that the code is available for unrestricted reuse.

## Repository

- **GitHub:** https://github.com/Kshitijbharne61/-ColdGuard
