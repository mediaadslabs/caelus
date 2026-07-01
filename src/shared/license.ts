import * as crypto from 'crypto';

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAmojN92oZ1woWErHKohGU33yxIucvNVhu2wzvyG2fFm8=
-----END PUBLIC KEY-----`;

export interface LicensePayload {
  client: string;
  features: string[];
  iat: string;
  exp: string;
}

export interface LicenseResult {
  valid: boolean;
  payload: LicensePayload | null;
  error?: string;
}

export function decodeLicenseKey(key: string): LicenseResult {
  try {
    const parts = key.trim().split('.');
    if (parts.length !== 2) {
      return { valid: false, payload: null, error: 'Invalid format' };
    }

    const [encodedPayload, signature] = parts;
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: LicensePayload = JSON.parse(payloadJson);

    if (!payload.client || !payload.features || !payload.iat || !payload.exp) {
      return { valid: false, payload: null, error: 'Invalid payload structure' };
    }

    const verified = crypto.verify(
      null,
      Buffer.from(payloadJson, 'utf-8'),
      PUBLIC_KEY_PEM,
      Buffer.from(signature, 'base64url'),
    );

    if (!verified) {
      return { valid: false, payload: null, error: 'Invalid signature' };
    }

    const now = new Date();
    const exp = new Date(payload.exp);
    if (exp < now) {
      return { valid: false, payload, error: 'License expired' };
    }

    if (!payload.features.includes('premium')) {
      return { valid: false, payload, error: 'Missing premium feature' };
    }

    return { valid: true, payload };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { valid: false, payload: null, error: msg };
  }
}
