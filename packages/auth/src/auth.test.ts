import { describe, expect, it } from 'vitest';
import { hashPassword, needsRehash, verifyPassword } from './password';
import { generateToken, hashToken, sign, verifySignature } from './tokens';
import { decryptSecret, encryptSecret, generateTotpSecret, totpCode, verifyTotp } from './totp';
import { randomBytes } from 'node:crypto';

describe('wachtwoorden', () => {
  it('hasht en verifieert, en wijst een verkeerd wachtwoord af', async () => {
    const h = await hashPassword('timmerman-2026-ok');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('timmerman-2026-ok', h)).toBe(true);
    expect(await verifyPassword('timmerman-2026-nee', h)).toBe(false);
    expect(needsRehash(h)).toBe(false);
  });

  it('herkent hashes met verouderde parameters', async () => {
    const h = (await hashPassword('x-y-z-1234567890')).replace(/^scrypt\$\d+/, 'scrypt$16384');
    expect(needsRehash(h)).toBe(true);
  });

  it('weigert kapotte opslag zonder te crashen', async () => {
    expect(await verifyPassword('wat-dan-ook-123', 'plaintext')).toBe(false);
  });
});

describe('tokens', () => {
  it('maakt unieke tokens en deterministische hashes', () => {
    const a = generateToken(), b = generateToken();
    expect(a).not.toBe(b);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toHaveLength(64);
  });

  it('ondertekent en verifieert met een geheim', () => {
    const sig = sign('sessie-123', 'geheim');
    expect(verifySignature('sessie-123', sig, 'geheim')).toBe(true);
    expect(verifySignature('sessie-124', sig, 'geheim')).toBe(false);
    expect(verifySignature('sessie-123', sig, 'ander')).toBe(false);
  });
});

describe('TOTP', () => {
  it('komt overeen met de RFC 6238-testvector', () => {
    // Secret "12345678901234567890" (base32 GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ), T=59s → 287082 (SHA1)
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe('287082');
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1_111_111_109_000)).toBe('081804');
  });

  it('accepteert één stap klokafwijking en weigert daarbuiten', () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const code = totpCode(secret, now);
    expect(verifyTotp(secret, code, now + 29_000)).toBe(true);
    expect(verifyTotp(secret, code, now - 30_000)).toBe(true);
    expect(verifyTotp(secret, code, now + 120_000)).toBe(false);
    expect(verifyTotp(secret, 'abc', now)).toBe(false);
  });

  it('versleutelt het geheim omkeerbaar en detecteert manipulatie', () => {
    const key = randomBytes(32);
    const secret = generateTotpSecret();
    const enc = encryptSecret(secret, key);
    expect(decryptSecret(enc, key)).toBe(secret);
    const tampered = enc.slice(0, -2) + 'AA';
    expect(() => decryptSecret(tampered, key)).toThrow();
  });
});
