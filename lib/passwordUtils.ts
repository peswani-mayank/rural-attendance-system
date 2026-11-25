import bcrypt from "bcryptjs";

const SALT_ROUNDS = 8;

/**
 * Hash a plain text password or PIN using bcryptjs.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword.trim(), salt);
}

/**
 * Verify whether a plain text password matches a stored hash.
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  if (!plainPassword || !hash) return false;
  return bcrypt.compare(plainPassword.trim(), hash);
}

/**
 * Validate password requirements.
 */
export function validatePasswordStrength(password: string, minLength = 4): { valid: boolean; message?: string } {
  if (!password || password.trim().length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long.`,
    };
  }
  return { valid: true };
}
