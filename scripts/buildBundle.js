// scripts/buildBundle.js
// Universal bundler for ColdGuard: packages modules into js/bundle.js for zero-CORS browser support

const fs = require('fs');
const path = require('path');

const files = [
  'js/data/mockData.js',
  'js/engine/excursionEngine.js',
  'js/engine/viabilityModel.js',
  'js/engine/simulationEngine.js',
  'js/components/mapView.js',
  'js/components/charts.js',
  'js/components/modals.js',
  'js/auth/firebaseAuth.js',
  'js/database/firebaseDatabase.js',
  'js/auth/authUi.js',
  'js/app.js'
];

let bundleContent = "// ColdGuard Universal Standalone Bundle with Live Firebase Authentication & Realtime Database\n";

for (const relPath of files) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // Strip imports
  content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  
  // Strip export keywords
  content = content.replace(/^export\s+default\s+/gm, '');
  content = content.replace(/^export\s+const\s+/gm, 'const ');
  content = content.replace(/^export\s+class\s+/gm, 'class ');
  content = content.replace(/^export\s+function\s+/gm, 'function ');
  content = content.replace(/^export\s*\{[\s\S]*?\};?\s*$/gm, '');

  bundleContent += `\n// --- FILE: ${relPath} ---\n` + content + '\n';
}

const outputPath = path.join(__dirname, '..', 'js', 'bundle.js');
fs.writeFileSync(outputPath, bundleContent, 'utf8');
console.log(`Successfully built js/bundle.js (${(bundleContent.length / 1024).toFixed(1)} KB)`);
