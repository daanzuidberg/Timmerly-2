import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))));
}

/**
 * Wachtwoordhashing met scrypt (ingebouwd in Node, geen native afhankelijkheid).
 * Parameters volgen de OWASP-aanbeveling (N=2^17, r=8, p=1). Het formaat
 * `scrypt$N$r$p$salt$hash` maakt latere parameterwijzigingen mogelijk zonder
 * migratie: oude hashes blijven verifieerbaar en worden bij login opnieuw gehasht.
 */
const N = 2 ** 17;
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 });
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !n || !r || !p || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Waar of de hash met verouderde parameters is gemaakt (dan opnieuw hashen bij login). */
export function needsRehash(stored: string): boolean {
  const [algo, n, r, p] = stored.split('$');
  return algo !== 'scrypt' || Number(n) !== N || Number(r) !== R || Number(p) !== P;
}
