import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const DIGEST = 'sha512';

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
}

type SyncPayload = {
  version: number;
  timestamp: string;
  data: string;
};

export function encryptData(data: string, password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  const payload: SyncPayload = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: JSON.stringify({
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted,
    }),
  };
  return JSON.stringify(payload);
}

export function decryptData(encryptedJson: string, password: string): string | null {
  try {
    const payload: SyncPayload = JSON.parse(encryptedJson);
    if (payload.version !== 1) return null;
    const inner = JSON.parse(payload.data);
    const salt = Buffer.from(inner.salt, 'hex');
    const iv = Buffer.from(inner.iv, 'hex');
    const tag = Buffer.from(inner.tag, 'hex');
    const key = deriveKey(password, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(inner.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

export async function pushSync(
  data: string,
  serverUrl: string,
  password: string,
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const encrypted = encryptData(data, password);
    const url = `${serverUrl.replace(/\/$/, '')}/sync/data`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: encrypted,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return { success: false, error: `Server returned HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function pullSync(
  serverUrl: string,
  password: string,
  apiKey: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const url = `${serverUrl.replace(/\/$/, '')}/sync/data`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return { success: false, error: `Server returned HTTP ${res.status}` };
    }
    const encryptedJson = await res.text();
    const decrypted = decryptData(encryptedJson, password);
    if (decrypted === null) {
      return { success: false, error: 'Failed to decrypt data. Wrong password?' };
    }
    return { success: true, data: decrypted };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function testConnection(
  serverUrl: string,
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${serverUrl.replace(/\/$/, '')}/sync/health`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
