import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** Willekeurig, URL-veilig token. De database bewaart alleen de SHA-256-hash. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** HMAC voor gesigneerde waarden (bijv. CSRF-token gebonden aan sessie). */
export function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function verifySignature(value: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(sign(value, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
