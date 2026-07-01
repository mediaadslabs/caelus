// Admin tool: Generate a signed license key
// Usage: node scripts/generate-license.js <client-name> [expiry-date]
//   client-name  - identifier for the licensee (e.g., "Acme Corp" or email)
//   expiry-date  - ISO date string (default: 1 year from now)
//
// Example:
//   node scripts/generate-license.js "Helder Ventura"
//   node scripts/generate-license.js "helder@example.com" 2028-12-31
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const privateKeyPath = path.join(__dirname, '..', 'license-private.pem');
if (!fs.existsSync(privateKeyPath)) {
  console.error('Error: license-private.pem not found.');
  console.error('Run node scripts/generate-keypair.js first.');
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
const clientName = process.argv[2];
const expiryStr = process.argv[3];

if (!clientName) {
  console.error('Usage: node scripts/generate-license.js <client-name> [expiry-date]');
  process.exit(1);
}

const expiresAt = expiryStr
  ? new Date(expiryStr).toISOString()
  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

const payload = JSON.stringify({
  client: clientName,
  features: ['premium'],
  iat: new Date().toISOString(),
  exp: expiresAt,
});

const signature = crypto.sign(null, Buffer.from(payload, 'utf-8'), privateKey).toString('base64url');

const licenseKey = Buffer.from(payload, 'utf-8').toString('base64url') + '.' + signature;

console.log('=== LICENSE KEY ===');
console.log(licenseKey);
console.log('===================');
console.log();
console.log('Payload:');
console.log(`  Client:    ${clientName}`);
console.log(`  Issued:    ${new Date().toISOString()}`);
console.log(`  Expires:   ${expiresAt}`);
console.log(`  Features:  premium`);
