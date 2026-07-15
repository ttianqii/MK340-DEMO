// Node-only password hashing for local demo student accounts (see
// src/db/schema.ts `students.passwordHash`). Scrypt is used because it's
// built into Node — no extra dependency needed.
import crypto from "crypto";

const KEY_LEN = 64;

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, KEY_LEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(plain, salt, KEY_LEN);

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
