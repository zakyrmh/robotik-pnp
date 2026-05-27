import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-fallback-key-32-chars-long';

// Derive a 32-byte key from the secret
const key = crypto.createHash('sha256').update(SECRET_KEY).digest();

export function encryptToken(payload: object): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Combine IV and ciphertext into a short hex string separated by a dot or dash
  // to make it URL-safe and short
  return `${iv.toString('hex')}-${encrypted}`;
}

export function decryptToken(token: string): Record<string, unknown> {
  const parts = token.split('-');
  if (parts.length !== 2) {
    throw new Error('Invalid token format');
  }
  const [ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
