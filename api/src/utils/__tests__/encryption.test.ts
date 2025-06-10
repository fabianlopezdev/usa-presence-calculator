import { describe, it, expect, beforeEach } from 'vitest';
import {
  EncryptionService,
  encryptField,
  decryptField,
  encryptSensitiveFields,
  decryptSensitiveFields,
} from '../encryption';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const testKey = 'test-key-that-is-at-least-32-characters-long-for-testing';

  beforeEach(() => {
    encryptionService = new EncryptionService(testKey);
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'This is sensitive data';
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toBeTruthy();

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      expect(encryptionService.encrypt('')).toBe('');
      expect(encryptionService.decrypt('')).toBe('');
    });

    it('should handle special characters and unicode', () => {
      const plaintext = 'Hello 👋 World! Special chars: @#$%^&*()_+';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'Same text';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should throw error when decrypting invalid data', () => {
      expect(() => {
        encryptionService.decrypt('invalid-base64-data!@#$');
      }).toThrow('Failed to decrypt data');
    });

    it('should throw error when decrypting tampered data', () => {
      const plaintext = 'Original text';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with the encrypted data
      const tampered = `${encrypted.slice(0, -2)}XX`;

      expect(() => {
        encryptionService.decrypt(tampered);
      }).toThrow('Failed to decrypt data');
    });
  });

  describe('encryptFields/decryptFields', () => {
    it('should encrypt specified fields in an object', () => {
      const original = {
        id: '123',
        name: 'John Doe',
        location: 'New York',
        email: 'john@example.com',
        age: 30,
      };

      const fieldsToEncrypt = ['location', 'email'];
      const encrypted = encryptionService.encryptFields(original, fieldsToEncrypt);

      expect(encrypted.id).toBe(original.id);
      expect(encrypted.name).toBe(original.name);
      expect(encrypted.age).toBe(original.age);
      expect(encrypted.location).not.toBe(original.location);
      expect(encrypted.email).not.toBe(original.email);

      const decrypted = encryptionService.decryptFields(encrypted, fieldsToEncrypt);
      expect(decrypted).toEqual(original);
    });

    it('should handle objects with missing fields', () => {
      const original = {
        id: '123',
        name: 'John Doe',
      };

      const fieldsToEncrypt = ['location', 'email', 'notes'];
      const encrypted = encryptionService.encryptFields(original, fieldsToEncrypt);

      expect(encrypted).toEqual(original);
    });

    it('should only encrypt string fields', () => {
      const original = {
        id: 123,
        location: 'New York',
        data: { nested: 'value' },
        tags: ['tag1', 'tag2'],
      };

      const fieldsToEncrypt = ['id', 'location', 'data', 'tags'];
      const encrypted = encryptionService.encryptFields(original, fieldsToEncrypt);

      expect(encrypted.id).toBe(123); // Number not encrypted
      expect(encrypted.location).not.toBe(original.location); // String encrypted
      expect(encrypted.data).toEqual(original.data); // Object not encrypted
      expect(encrypted.tags).toEqual(original.tags); // Array not encrypted
    });
  });

  describe('helper functions', () => {
    it('should encrypt/decrypt using helper functions', () => {
      const plaintext = 'Test data';
      const encrypted = encryptField(plaintext);
      const decrypted = decryptField(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt/decrypt sensitive fields using default list', () => {
      const tripData = {
        id: '123',
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris, France',
        notes: 'Business trip with family',
        email: 'user@example.com',
      };

      const encrypted = encryptSensitiveFields(tripData);

      // Check that sensitive fields are encrypted
      expect(encrypted.location).not.toBe(tripData.location);
      expect(encrypted.notes).not.toBe(tripData.notes);
      expect(encrypted.email).not.toBe(tripData.email);

      // Check that non-sensitive fields are not encrypted
      expect(encrypted.id).toBe(tripData.id);
      expect(encrypted.departureDate).toBe(tripData.departureDate);
      expect(encrypted.returnDate).toBe(tripData.returnDate);

      const decrypted = decryptSensitiveFields(encrypted);
      expect(decrypted).toEqual(tripData);
    });
  });

  describe('security', () => {
    it('should not decrypt with different key', () => {
      const plaintext = 'Secret data';
      const encrypted = encryptionService.encrypt(plaintext);

      const differentService = new EncryptionService(
        'different-key-that-is-also-32-characters-long!!',
      );

      expect(() => {
        differentService.decrypt(encrypted);
      }).toThrow('Failed to decrypt data');
    });
  });
});
