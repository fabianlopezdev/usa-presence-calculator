import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { SECURITY } from '@api/constants/security';
import { config } from '@api/config/env';

const { ALGORITHM, KEY_LENGTH, IV_LENGTH, TAG_LENGTH } = SECURITY.ENCRYPTION;

export class EncryptionService {
  private readonly key: Buffer;

  constructor(masterKey: string = config.MASTER_ENCRYPTION_KEY) {
    // Derive a key from the master key using scrypt
    const salt = 'usa-presence-calc-v1'; // Static salt for consistent key derivation
    this.key = scryptSync(masterKey, salt, KEY_LENGTH);
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    try {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, this.key, iv);

      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();

      // Combine iv, tag, and encrypted data
      const combined = Buffer.concat([iv, tag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract iv, tag, and encrypted content
      const iv = combined.subarray(0, IV_LENGTH);
      const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Utility method to encrypt an object's sensitive fields
  encryptFields<T extends Record<string, unknown>>(obj: T, fields: readonly string[]): T {
    const result = { ...obj };

    for (const field of fields) {
      if (field in result && typeof result[field] === 'string') {
        (result as Record<string, unknown>)[field] = this.encrypt(result[field]);
      }
    }

    return result;
  }

  // Utility method to decrypt an object's sensitive fields
  decryptFields<T extends Record<string, unknown>>(obj: T, fields: readonly string[]): T {
    const result = { ...obj };

    for (const field of fields) {
      if (field in result && typeof result[field] === 'string') {
        (result as Record<string, unknown>)[field] = this.decrypt(result[field]);
      }
    }

    return result;
  }
}

// Create a singleton instance for the application
export const encryptionService = new EncryptionService();

// Helper functions for easy use
export function encryptField(value: string): string {
  return encryptionService.encrypt(value);
}

export function decryptField(value: string): string {
  return encryptionService.decrypt(value);
}

export function encryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  fields: readonly string[] = SECURITY.SENSITIVE_FIELDS,
): T {
  return encryptionService.encryptFields(obj, fields);
}

export function decryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  fields: readonly string[] = SECURITY.SENSITIVE_FIELDS,
): T {
  return encryptionService.decryptFields(obj, fields);
}
