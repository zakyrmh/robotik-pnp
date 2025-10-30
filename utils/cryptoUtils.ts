/**
 * Crypto utilities untuk QR Code generation dan hashing
 */

/**
 * Generate SHA-256 hash dari string
 */
export async function generateSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Generate random string untuk keamanan
 */
export function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Encrypt data untuk QR Code (Simple encryption dengan base64 dan random salt)
 */
export function encryptQRData(data: string, salt: string): string {
  const combined = `${data}:${salt}`;
  return btoa(combined);
}

/**
 * Decrypt data dari QR Code
 */
export function decryptQRData(
  encryptedData: string
): { data: string; salt: string } | null {
  try {
    const decoded = atob(encryptedData);
    const [data, salt] = decoded.split(":");
    if (!data || !salt) return null;
    return { data, salt };
  } catch (error) {
    console.error("Failed to decrypt QR data:", error);
    return null;
  }
}

/**
 * Generate complete QR Code data with hash
 */
export async function generateQRCodeData(
  userId: string,
  activityId: string,
  expiryTimestamp: number
): Promise<{ encryptedData: string; hash: string; randomString: string }> {
  const randomString = generateRandomString(32);

  // Data: userId_activityId_expiryTimestamp_randomString
  const rawData = `${userId}_${activityId}_${expiryTimestamp}_${randomString}`;

  // Encrypt data
  const encryptedData = encryptQRData(rawData, randomString);

  // Generate hash untuk validasi
  const hash = await generateSHA256Hash(rawData);

  return {
    encryptedData,
    hash,
    randomString,
  };
}

/**
 * Validate QR Code data
 */
export async function validateQRCodeData(
  encryptedData: string,
  expectedHash: string
): Promise<{
  isValid: boolean;
  userId?: string;
  activityId?: string;
  expiryTimestamp?: number;
}> {
  const decrypted = decryptQRData(encryptedData);

  if (!decrypted) {
    return { isValid: false };
  }

  const { data } = decrypted;

  // Generate hash dari decrypted data
  const calculatedHash = await generateSHA256Hash(data);

  // Validasi hash
  if (calculatedHash !== expectedHash) {
    return { isValid: false };
  }

  // Parse data
  const [userId, activityId, expiryTimestamp] = data.split("_");

  if (!userId || !activityId || !expiryTimestamp) {
    return { isValid: false };
  }

  return {
    isValid: true,
    userId,
    activityId,
    expiryTimestamp: parseInt(expiryTimestamp),
  };
}

/**
 * Calculate attendance points based on status
 */
export function calculatePoints(status: string): number {
  switch (status) {
    case "present":
      return 100;
    case "late":
      return 75;
    case "excused":
      return 50;
    case "sick":
      return 50;
    case "absent":
    case "pending_approval":
      return 0;
    default:
      return 0;
  }
}
