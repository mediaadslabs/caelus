// Admin tool: Generate Ed25519 keypair for license signing
// Run: node scripts/generate-keypair.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const outDir = path.join(__dirname, '..');
fs.writeFileSync(path.join(outDir, 'license-private.pem'), privateKey);
fs.writeFileSync(path.join(outDir, 'license-public.pem'), publicKey);

console.log('Keypair generated:');
console.log(`  Private key: license-private.pem  (KEEP SECURE, do NOT commit)`);
console.log(`  Public key:  license-public.pem   (embed in app)`);
console.log();
console.log('Public key to embed:');
console.log(publicKey.trim());
