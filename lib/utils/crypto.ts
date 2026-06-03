import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-fallback-key-32-chars-long';

// Derive a 32-byte key from the secret
const key = crypto.createHash('sha256').update(SECRET_KEY).digest();

function uuidToBuffer(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '');
  return Buffer.from(hex, 'hex');
}

function bufferToUuid(buf: Buffer): string {
  const hex = buf.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-');
}

function isOldFormat(token: string): boolean {
  const parts = token.split('-');
  if (parts.length !== 2) return false;
  const [ivHex, encryptedHex] = parts;
  return ivHex.length === 32 && /^[0-9a-f]+$/i.test(ivHex) && /^[0-9a-f]+$/i.test(encryptedHex);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encryptToken(payload: any): string {
  // If payload matches the expected attendance format, pack it compactly
  if (
    payload &&
    typeof payload === 'object' &&
    typeof payload.profile_id === 'string' &&
    typeof payload.activity_id === 'string' &&
    typeof payload.generated_at === 'number'
  ) {
    const profileBuf = uuidToBuffer(payload.profile_id);
    const activityBuf = uuidToBuffer(payload.activity_id);
    
    // Allocate buffer: 16 (profile) + 16 (activity) + 8 (timestamp) + 1 (hasCoords)
    const hasCoords = payload.coordinates && 
                      typeof payload.coordinates.latitude === 'number' && 
                      typeof payload.coordinates.longitude === 'number';
                      
    const size = 16 + 16 + 8 + 1 + (hasCoords ? 8 : 0);
    const buf = Buffer.alloc(size);
    
    profileBuf.copy(buf, 0);
    activityBuf.copy(buf, 16);
    
    buf.writeBigInt64BE(BigInt(payload.generated_at), 32);
    buf.writeUInt8(hasCoords ? 1 : 0, 40);
    
    if (hasCoords) {
      buf.writeFloatBE(payload.coordinates.latitude, 41);
      buf.writeFloatBE(payload.coordinates.longitude, 45);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
    
    // Combine IV and encrypted buffer, encode to base64url
    return Buffer.concat([iv, encrypted]).toString('base64url');
  }

  // Fallback for general objects (original implementation using JSON string)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}-${encrypted}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decryptToken(token: string): Record<string, any> {
  // Check if it is the old format (split by hyphen, hexadecimal only)
  if (isOldFormat(token)) {
    const parts = token.split('-');
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Otherwise, assume compact binary format encoded in base64url
  try {
    const tokenBuf = Buffer.from(token, 'base64url');
    if (tokenBuf.length < 16 + 16) {
      throw new Error('Invalid token format');
    }
    
    const iv = tokenBuf.subarray(0, 16);
    const encrypted = tokenBuf.subarray(16);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    // Unpack binary structure
    const profileId = bufferToUuid(decrypted.subarray(0, 16));
    const activityId = bufferToUuid(decrypted.subarray(16, 32));
    const generatedAt = Number(decrypted.readBigInt64BE(32));
    const hasCoords = decrypted.readUInt8(40) === 1;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let coordinates: any = undefined;
    if (hasCoords && decrypted.length >= 49) {
      coordinates = {
        latitude: decrypted.readFloatBE(41),
        longitude: decrypted.readFloatBE(45)
      };
    }
    
    return {
      profile_id: profileId,
      activity_id: activityId,
      generated_at: generatedAt,
      coordinates
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error('Gagal mendeskripsi token: ' + msg);
  }
}
